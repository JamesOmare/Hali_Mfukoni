import { NativeModules, NativeEventEmitter } from 'react-native';
import { parseMpesaSms } from './parser';
import { insertTransaction, transactionExists } from '../db/transactions';

const { HMSmsListener } = NativeModules;
let subscription: { remove: () => void } | null = null;

export function startSmsListener(onNewTx: (id: string) => void): void {
  if (!HMSmsListener || subscription) return;
  const emitter = new NativeEventEmitter(HMSmsListener);
  subscription = emitter.addListener('onMpesaSms', async (event: { body: string; date: number }) => {
    const parsed = parseMpesaSms(event.body);
    if (!parsed) return;
    if (await transactionExists(parsed.id)) return;
    if (!parsed.dateIso && event.date) {
      parsed.dateIso = new Date(event.date).toISOString().slice(0, 10);
    }
    await insertTransaction(parsed);
    onNewTx(parsed.id);
  });
  HMSmsListener.startListening();
}

export function stopSmsListener(): void {
  if (!HMSmsListener) return;
  HMSmsListener.stopListening();
  subscription?.remove();
  subscription = null;
}
