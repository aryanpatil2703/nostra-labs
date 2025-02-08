import { BaseService } from "./base.service.js";
import {
  AgentRuntime,
  ModelProviderName,
  elizaLogger,
  MemoryManager,
  Character,
} from "@ai16z/eliza";

elizaLogger.closeByNewLine = false;
elizaLogger.verbose = true;

import { SqliteDatabaseAdapter } from "@ai16z/adapter-sqlite";
import Database from "better-sqlite3";
import path from "path";
import { sessionDatabase } from "../db/index.js";
const __dirname = path.dirname(new URL(import.meta.url).pathname);

import { composeContext } from "@ai16z/eliza";
import { getEmbeddingZeroVector } from "@ai16z/eliza";
import {
  Content,
  HandlerCallback,
  IAgentRuntime,
  IImageDescriptionService,
  Memory,
  ModelClass,
  State,
  UUID,
  CacheManager,
  MemoryCacheAdapter,
} from "@ai16z/eliza";
import { stringToUuid } from "@ai16z/eliza";

import { generateMessageResponse, generateShouldRespond } from "@ai16z/eliza";
import { messageCompletionFooter, shouldRespondFooter } from "@ai16z/eliza";
import { Message } from "grammy/types";
import { Bot, Context } from "grammy";
import { bootstrapPlugin } from "@ai16z/plugin-bootstrap";

import announceGameEventPlugin from "../plugins/nostra.plugin.js";
import { MrsBeautyBaseCharacter } from "../../../../characters/dist/index.js";

const MAX_MESSAGE_LENGTH = 4096; // Telegram's max message length

const telegramShouldRespondTemplate =
  `# About {{agentName}}:
{{bio}}

# RESPONSE EXAMPLES
{{user1}}: I just saw a really great movie
{{user2}}: Oh? Which movie?
Result: [IGNORE]

{{agentName}}: Oh, this is my favorite scene
{{user1}}: sick
{{user2}}: wait, why is it your favorite scene
Result: [RESPOND]

{{user1}}: stfu bot
Result: [STOP]

{{user1}}: Hey {{agent}}, can you help me with something
Result: [RESPOND]

{{user1}}: {{agentName}} stfu plz
Result: [STOP]

{{user1}}: i need help
{{agentName}}: how can I help you?
{{user1}}: no. i need help from someone else
Result: [IGNORE]

{{user1}}: Hey {{agent}}, can I ask you a question
{{agentName}}: Sure, what is it
{{user1}}: can you ask claude to create a basic react module that demonstrates a counter
Result: [RESPOND]

{{user1}}: {{agentName}} can you tell me a story
{{agentName}}: uhhh...
{{user1}}: please do it
{{agentName}}: okay
{{agentName}}: once upon a time, in a quaint little village, there was a curious girl named elara
{{user1}}: I'm loving it, keep going
Result: [RESPOND]

{{user1}}: {{agentName}} stop responding plz
Result: [STOP]

{{user1}}: okay, i want to test something. {{agentName}}, can you say marco?
{{agentName}}: marco
{{user1}}: great. okay, now do it again
Result: [RESPOND]

Response options are [RESPOND], [IGNORE] and [STOP].

{{agentName}} is in a room with other users and should only respond when they are being addressed, and should not respond if they are continuing a conversation that is very long.

Respond with [RESPOND] to messages that are directed at {{agentName}}, or participate in conversations that are interesting or relevant to their background.
If a message is not interesting, relevant, or does not directly address {{agentName}}, respond with [IGNORE]

Also, respond with [IGNORE] to messages that are very short or do not contain much information.

If a user asks {{agentName}} to be quiet, respond with [STOP]
If {{agentName}} concludes a conversation and isn't part of the conversation anymore, respond with [STOP]

IMPORTANT: {{agentName}} is particularly sensitive about being annoying, so if there is any doubt, it is better to respond with [IGNORE].
If {{agentName}} is conversing with a user and they have not asked to stop, it is better to respond with [RESPOND].

The goal is to decide whether {{agentName}} should respond to the last message.

{{recentMessages}}

Thread of Tweets You Are Replying To:

{{formattedConversation}}

# INSTRUCTIONS: Choose the option that best describes {{agentName}}'s response to the last message. Ignore messages if they are addressed to someone else.
` + shouldRespondFooter;

const telegramMessageHandlerTemplate =
  // {{goals}}
  `# Action Names
{{actionNames}}

# Action Examples
{{actionExamples}}
(Action examples are for reference only. Do not use the information from them in your response.)

# Knowledge
{{knowledge}}

# Task: Generate dialog and actions for the character {{agentName}}.
About {{agentName}}:
{{bio}}
{{lore}}

Examples of {{agentName}}'s dialog and actions:
{{messageExamples}}

{{providers}}

{{attachments}}

{{actions}}

# Capabilities
Note that {{agentName}} is capable of reading/seeing/hearing various forms of media, including images, videos, audio, plaintext and PDFs. Recent attachments have been included above under the "Attachments" section.

{{messageDirections}}

{{recentMessages}}

# Task: Generate a post/reply in the voice, style and perspective of {{agentName}} (@{{twitterUserName}}) while using the thread of tweets as additional context:
Current Post:
{{currentPost}}
Thread of Tweets You Are Replying To:

{{formattedConversation}}
` + messageCompletionFooter;

export class MessageManager {
  public bot: Bot<Context>;
  private runtime: IAgentRuntime;
  private imageService: IImageDescriptionService;

  constructor(bot: Bot<Context>, runtime: IAgentRuntime) {
    this.bot = bot;
    this.runtime = runtime;
  }

  // Process image messages and generate descriptions
  private async processImage(
    message: Message
  ): Promise<{ description: string } | null> {
    // elizaLogger.info(
    //     "🖼️ Processing image message:",
    //     JSON.stringify(message, null, 2)
    // );

    try {
      let imageUrl: string | null = null;

      // Handle photo messages
      if ("photo" in message && message.photo!.length > 0) {
        const photo = message.photo![message.photo!.length - 1];
        const fileLink = await this.bot.api.getFile(photo.file_id);
        imageUrl = fileLink.toString();
      }
      // Handle image documents
      else if (
        "document" in message &&
        message.document?.mime_type?.startsWith("image/")
      ) {
        const doc = message.document;
        const fileLink = await this.bot.api.getFile(doc.file_id);
        imageUrl = fileLink.toString();
      }

      if (imageUrl) {
        const { title, description } =
          await this.imageService.describeImage(imageUrl);
        const fullDescription = `[Image: ${title}\n${description}]`;
        return { description: fullDescription };
      }
    } catch (error) {
      console.error("❌ Error processing image:", error);
    }

    return null; // No image found
  }

  // Decide if the bot should respond to the message
  private async _shouldRespond(
    message: Message,
    state: State
  ): Promise<boolean> {
    // Respond if bot is mentioned

    if (
      "text" in message &&
      message.text?.includes(`@${this.bot.botInfo?.username}`)
    ) {
      return true;
    }

    // Respond to private chats
    if (message.chat.type === "private") {
      return true;
    }

    // Respond to images in group chats
    if (
      "photo" in message ||
      ("document" in message &&
        message.document?.mime_type?.startsWith("image/"))
    ) {
      return false;
    }

    // Use AI to decide for text or captions
    if ("text" in message || ("caption" in message && message.caption)) {
      const shouldRespondContext = composeContext({
        state,
        template:
          this.runtime.character.templates?.telegramShouldRespondTemplate ||
          this.runtime.character?.templates?.shouldRespondTemplate ||
          telegramShouldRespondTemplate,
      });

      const response = await generateShouldRespond({
        runtime: this.runtime,
        context: shouldRespondContext,
        modelClass: ModelClass.MEDIUM,
      });

      return response === "RESPOND";
    }

    return false; // No criteria met
  }

  // Send long messages in chunks
  private async sendMessageInChunks(
    ctx: Context,
    content: string,
    replyToMessageId?: number
  ): Promise<Message.TextMessage[]> {
    const chunks = this.splitMessage(content);
    const sentMessages: Message.TextMessage[] = [];

    for (let i = 0; i < chunks.length; i++) {
      const chunk = chunks[i];
      const sentMessage = (await this.bot.api.sendMessage(ctx.chat!.id, chunk, {
        reply_parameters:
          i === 0 && replyToMessageId
            ? { message_id: replyToMessageId }
            : undefined,
      })) as Message.TextMessage;

      sentMessages.push(sentMessage);
    }

    return sentMessages;
  }

  // Split message into smaller parts
  private splitMessage(text: string): string[] {
    const chunks: string[] = [];
    let currentChunk = "";

    const lines = text.split("\n");
    for (const line of lines) {
      if (currentChunk.length + line.length + 1 <= MAX_MESSAGE_LENGTH) {
        currentChunk += (currentChunk ? "\n" : "") + line;
      } else {
        if (currentChunk) chunks.push(currentChunk);
        currentChunk = line;
      }
    }

    if (currentChunk) chunks.push(currentChunk);
    return chunks;
  }

  // Generate a response using AI
  private async _generateResponse(
    message: Memory,
    _state: State,
    context: string
  ): Promise<Content | null> {
    const { userId, roomId } = message;
    elizaLogger.debug("[_generateResponse] check1");
    const response = await generateMessageResponse({
      runtime: this.runtime,
      context,
      modelClass: ModelClass.MEDIUM,
    });
    elizaLogger.debug("[_generateResponse] check2");
    if (!response) {
      console.error("❌ No response from generateMessageResponse");
      return null;
    }
    elizaLogger.debug("[_generateResponse] check3");
    // store the response in the database

    await this.runtime.databaseAdapter.log({
      body: { message, context, response },
      userId: userId,
      roomId,
      type: "response",
    });
    elizaLogger.debug("[_generateResponse] check4");
    return response;
  }

  // Main handler for incoming messages
  public async handleMessage(ctx: Context): Promise<void> {
    if (!ctx.message || !ctx.from) {
      return; // Exit if no message or sender info
    }

    if (
      this.runtime.character.clientConfig?.telegram?.shouldIgnoreBotMessages &&
      ctx.from.is_bot
    ) {
      return;
    }
    if (
      this.runtime.character.clientConfig?.telegram
        ?.shouldIgnoreDirectMessages &&
      ctx.chat?.type === "private"
    ) {
      return;
    }

    const message = ctx.message;

    try {
      // Convert IDs to UUIDs
      const userId = stringToUuid(ctx.from.id.toString()) as UUID;
      const userName =
        ctx.from.username || ctx.from.first_name || "Unknown User";
      const chatId = stringToUuid(
        ctx.chat?.id.toString() + "-" + this.runtime.agentId
      ) as UUID;
      const agentId = this.runtime.agentId;
      const roomId = chatId;

      await this.runtime.ensureConnection(
        userId,
        roomId,
        userName,
        userName,
        "telegram"
      );

      const messageId = stringToUuid(
        message.message_id.toString() + "-" + this.runtime.agentId
      ) as UUID;

      // Handle images
      const imageInfo = await this.processImage(message);

      // Get text or caption
      let messageText = "";
      if ("text" in message) {
        messageText = ctx.match as string;
      } else if ("caption" in message && message.caption) {
        messageText = message.caption;
      }

      // Combine text and image description
      const fullText = imageInfo
        ? `${messageText} ${imageInfo.description}`
        : messageText;

      if (!fullText) {
        return; // Skip if no content
      }

      const content: Content = {
        text: fullText,
        source: "telegram",
        inReplyTo:
          "reply_to_message" in message && message.reply_to_message
            ? stringToUuid(
                message.reply_to_message.message_id.toString() +
                  "-" +
                  this.runtime.agentId
              )
            : undefined,
      };

      // Create memory for the message

      const memory = await this.runtime.messageManager.addEmbeddingToMemory({
        id: messageId,
        agentId,
        userId,
        roomId,
        content,
        createdAt: message.date * 1000,
      });
      // set unique to avoid duplicating memories
      await this.runtime.messageManager.createMemory(memory, true);
      // Update state with the new memory
      let state = await this.runtime.composeState(memory);
      state = await this.runtime.updateRecentMessageState(state);
      // Decide whether to respond
      const shouldRespond = await this._shouldRespond(message, state);

      if (shouldRespond) {
        const context = composeContext({
          state,
          template:
            this.runtime.character.templates?.telegramMessageHandlerTemplate ||
            this.runtime.character?.templates?.messageHandlerTemplate ||
            telegramMessageHandlerTemplate,
        });
        elizaLogger.debug(
          "[handleMessage] context",
          JSON.stringify(context, null, 2)
        );
        const responseContent = await this._generateResponse(
          memory,
          state,
          context
        );

        if (!responseContent || !responseContent.text) return;

        // Send response in chunks
        const callback: HandlerCallback = async (content: Content) => {
          const sentMessages = await this.sendMessageInChunks(
            ctx,
            content.text,
            message.message_id
          );

          const memories: Memory[] = [];

          // Create memories for each sent message
          for (let i = 0; i < sentMessages.length; i++) {
            const sentMessage = sentMessages[i];
            const isLastMessage = i === sentMessages.length - 1;

            const memory: Memory = {
              id: stringToUuid(
                sentMessage.message_id.toString() + "-" + this.runtime.agentId
              ),
              agentId,
              userId,
              roomId,
              content: {
                ...content,
                text: sentMessage.text,
                inReplyTo: messageId,
              },
              createdAt: sentMessage.date * 1000,
              embedding: getEmbeddingZeroVector(),
            };
            elizaLogger.info(
              `[eliza.service] memory action ${memory.content.action}`
            );

            // Set action to CONTINUE for all messages except the last one
            // For the last message, use the original action from the response content
            memory.content.action = !isLastMessage ? "IGNORE" : content.action;

            await this.runtime.messageManager.createMemory(memory);
            memories.push(memory);
          }

          return memories;
        };

        // Execute callback to send messages and log memories
        const responseMessages = await callback(responseContent);

        // Update state after response
        state = await this.runtime.updateRecentMessageState(state);

        elizaLogger.debug("[eliza.service] processing resulting actions");
        await this.runtime.processActions(
          memory,
          responseMessages,
          state,
          callback
        );

        elizaLogger.debug("[eliza.service] evaluating");
        const data = await this.runtime.evaluate(memory, state, shouldRespond);
        elizaLogger.debug(`[eliza.service] evaluated ${data}`);
      }
    } catch (error) {
      console.error("❌ Error handling message:", error);
      console.error("Error sending message:", error);
    }
  }
}

export class ElizaService extends BaseService {
  private static instance: ElizaService;
  private runtime: AgentRuntime;
  public messageManager: MessageManager;
  private bot: Bot<Context>;

  private constructor(bot: Bot<Context>) {
    super();

    // Load character from json file
    const character = MrsBeautyBaseCharacter as Character;

    const sqlitePath = path.join(__dirname, "..", "..", "..", "eliza.sqlite");
    elizaLogger.info("Using SQLite database at:", sqlitePath);
    // Initialize SQLite adapter
    const db = new SqliteDatabaseAdapter(new Database(sqlitePath));

    db.init()
      .then(() => {
        elizaLogger.info("Database initialized.");
      })
      .catch((error) => {
        console.error("Failed to initialize database:", error);
        throw error;
      });

    try {
      this.runtime = new AgentRuntime({
        databaseAdapter: db,
        token: process.env.OPENAI_API_KEY || "",
        modelProvider: character.modelProvider || ModelProviderName.OPENAI,
        character,
        conversationLength: 4096,

        plugins: [bootstrapPlugin, announceGameEventPlugin],
        cacheManager: new CacheManager(new MemoryCacheAdapter()),
        logging: true,
      });
      // Create memory manager
      const onChainMemory = new MemoryManager({
        tableName: "onchain",
        runtime: this.runtime,
      });
      this.runtime.registerMemoryManager(onChainMemory);
      this.messageManager = new MessageManager(bot, this.runtime);
      this.bot = bot;
    } catch (error) {
      console.error("Failed to initialize Eliza runtime:", error);
      throw error;
    }
  }

  public static getInstance(bot: Bot<Context>): ElizaService {
    if (!ElizaService.instance) {
      ElizaService.instance = new ElizaService(bot);
    }
    return ElizaService.instance;
  }

  public async start(): Promise<void> {
    try {
      await sessionDatabase.init();

      //register AI based command handlers here
      this.bot.command("subscribe", (ctx) => {
        sessionDatabase.addSubscriber(
          ctx.chat.id.toString(),
          ctx.chat.username ?? ""
        );
        ctx.reply("Subscribed to show! Welcome!");
      });
      this.bot.command("unsubscribe", (ctx) => {
        sessionDatabase.removeSubscriber(ctx.chat.id.toString());
        ctx.reply("Unsubscribed from show! Goodbye!");
      });
      this.bot.command("message", (ctx) =>
        this.messageManager.handleMessage(ctx)
      );
      elizaLogger.info("Eliza service started successfully");
    } catch (error) {
      console.error("Failed to start Eliza service:", error);
      throw error;
    }
  }

  public getRuntime(): AgentRuntime {
    return this.runtime;
  }

  public async stop(): Promise<void> {
    try {
      elizaLogger.info("Eliza service stopped");
    } catch (error) {
      console.error("Error stopping Eliza service:", error);
    }
  }
}
