import { 
  ConnectWallet, 
  Wallet, 
  WalletDropdown, 
  WalletDropdownDisconnect, 
} from '@coinbase/onchainkit/wallet';
import {
  Address,
  Avatar,
  Name,
  Identity,
  EthBalance,
} from '@coinbase/onchainkit/identity';
import '@coinbase/onchainkit/styles.css';
import { color } from '@coinbase/onchainkit/theme';
import { useEffect } from 'react';

export function WalletComponents() {
  useEffect(() => {
    if (window.ethereum && window.ethereum.on) {
      const handleAccountsChanged = (accounts: string[]) => {
        // If there is at least one account, reload the page to update connection state.
        if (accounts && accounts.length > 0) {
          window.location.reload();
        }
      };

      // Subscribe to account changes.
      window.ethereum.on('accountsChanged', handleAccountsChanged);

      return () => {
        if (window.ethereum.removeListener) {
          window.ethereum.removeListener('accountsChanged', handleAccountsChanged);
        }
      };
    }
  }, []);

  return (
    <div className="flex justify-end">
      <Wallet>
        <ConnectWallet>
          <Avatar className="h-6 w-6" />
          <Name />
        </ConnectWallet>
        <WalletDropdown>
          <Identity className="px-4 pt-3 pb-2" hasCopyAddressOnClick>
            <Avatar />
            <Name />
            <Address className={color.foregroundMuted} />
            <EthBalance className={color.foregroundMuted} />
          </Identity>
          <WalletDropdownDisconnect />
        </WalletDropdown>
      </Wallet>
    </div>
  );
}
