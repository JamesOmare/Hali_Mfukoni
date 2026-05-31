package com.halimfukoni;

import android.content.BroadcastReceiver;
import android.content.Context;
import android.content.Intent;
import android.content.IntentFilter;
import android.os.Bundle;
import android.telephony.SmsMessage;

import com.facebook.react.bridge.ReactApplicationContext;
import com.facebook.react.bridge.ReactContextBaseJavaModule;
import com.facebook.react.bridge.ReactMethod;
import com.facebook.react.bridge.WritableMap;
import com.facebook.react.bridge.Arguments;
import com.facebook.react.modules.core.DeviceEventManagerModule;

import javax.annotation.Nullable;

public class SmsModule extends ReactContextBaseJavaModule {
    private static final String MODULE_NAME = "HMSmsListener";
    private static final String SMS_EVENT = "onMpesaSms";
    private final ReactApplicationContext reactContext;
    private BroadcastReceiver receiver;

    public SmsModule(ReactApplicationContext reactContext) {
        super(reactContext);
        this.reactContext = reactContext;
    }

    @Override
    public String getName() {
        return MODULE_NAME;
    }

    @ReactMethod
    public void startListening() {
        if (receiver != null) return;
        receiver = new BroadcastReceiver() {
            @Override
            public void onReceive(Context context, Intent intent) {
                Bundle bundle = intent.getExtras();
                if (bundle == null) return;
                Object[] pdus = (Object[]) bundle.get("pdus");
                String format = bundle.getString("format");
                if (pdus == null) return;
                for (Object pdu : pdus) {
                    SmsMessage msg = SmsMessage.createFromPdu((byte[]) pdu, format);
                    if (msg == null) continue;
                    String body = msg.getMessageBody();
                    String from = msg.getOriginatingAddress() != null
                            ? msg.getOriginatingAddress() : "";
                    if (!from.toUpperCase().contains("MPESA") && !body.toUpperCase().contains("MPESA")) {
                        continue;
                    }
                    WritableMap params = Arguments.createMap();
                    params.putString("body", body);
                    params.putString("from", from);
                    params.putDouble("date", msg.getTimestampMillis());
                    sendEvent(SMS_EVENT, params);
                }
            }
        };
        IntentFilter filter = new IntentFilter("android.provider.Telephony.SMS_RECEIVED");
        filter.setPriority(999);
        reactContext.registerReceiver(receiver, filter);
    }

    @ReactMethod
    public void stopListening() {
        if (receiver != null) {
            try { reactContext.unregisterReceiver(receiver); } catch (Exception ignored) {}
            receiver = null;
        }
    }

    private void sendEvent(String eventName, @Nullable WritableMap params) {
        reactContext
            .getJSModule(DeviceEventManagerModule.RCTDeviceEventEmitter.class)
            .emit(eventName, params);
    }

    @ReactMethod
    public void addListener(String eventName) {}

    @ReactMethod
    public void removeListeners(Integer count) {}
}
