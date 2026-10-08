export interface BridgeResult {
  success: boolean;
  action: string;
  target?: string;
  status: 'preview_bridge_required' | 'native_executed' | 'error';
  userMessageBn: string;
  userMessageEn: string;
  technicalDetails?: string;
}

export interface RecognizedAndroidCommand {
  type: 'open_youtube' | 'open_whatsapp' | 'open_chrome' | 'open_facebook' | 'open_app' | 'scroll_youtube' | 'scroll' | 'whatsapp_msg' | 'call' | 'sms' | 'volume_up' | 'volume_down' | 'volume' | 'torch' | 'time' | 'none';
  target?: string;
  details?: string;
  rawQuery: string;
}

export class AndroidBridgeArchitecture {
  private getNativeBridge(): any {
    if (typeof window === 'undefined') return null;
    return (window as any).AndroidBridge || (window as any).AndroidNativeBridge || null;
  }

  public isNativeEnvironment(): boolean {
    return this.getNativeBridge() !== null;
  }

  public isAccessibilityServiceEnabled(): boolean {
    const bridge = this.getNativeBridge();
    if (bridge && typeof bridge.isAccessibilityServiceEnabled === 'function') {
      try {
        return bridge.isAccessibilityServiceEnabled();
      } catch {
        return false;
      }
    }
    return false;
  }

  public openAccessibilitySettings(): void {
    const bridge = this.getNativeBridge();
    if (bridge && typeof bridge.openAccessibilitySettings === 'function') {
      try {
        bridge.openAccessibilitySettings();
      } catch (err) {
        console.error('Failed to open accessibility settings:', err);
      }
    }
  }

  /**
   * Evaluates spoken or typed text for Android Assistant system commands
   */
  public parseCommand(query: string): RecognizedAndroidCommand {
    const text = query.trim().toLowerCase();

    // Time command
    if (
      text.includes('সময় বলো') ||
      text.includes('কয়টা বাজে') ||
      text.includes('time') ||
      text.includes('কটা বাজে') ||
      text.includes('এখন সময় কত')
    ) {
      return { type: 'time', rawQuery: query };
    }

    // YouTube Scroll Down
    if (
      (text.includes('ইউটিউব') || text.includes('youtube')) &&
      (text.includes('স্ক্রল করো') || text.includes('স্ক্রল ডাউন') || text.includes('scroll') || text.includes('নিচে যাও') || text.includes('নিচে স্ক্রল'))
    ) {
      return { type: 'scroll_youtube', target: 'YouTube', details: 'down', rawQuery: query };
    }

    // General Scroll
    if (text.includes('স্ক্রল ডাউন') || text.includes('scroll down') || text.includes('নিচে নামাও')) {
      return { type: 'scroll', details: 'down', rawQuery: query };
    }
    if (text.includes('স্ক্রল আপ') || text.includes('scroll up') || text.includes('উপরে উঠাও')) {
      return { type: 'scroll', details: 'up', rawQuery: query };
    }

    // YouTube Open Commands: "ইউটিউব খোলো", "ওপেন ইউটিউব", "Open YouTube", "YouTube খুলে দাও"
    if (
      text.includes('ইউটিউব খোলো') ||
      text.includes('ওপেন ইউটিউব') ||
      text.includes('open youtube') ||
      text.includes('youtube খুলে দাও') ||
      text.includes('youtube open') ||
      text.includes('খোলো ইউটিউব')
    ) {
      return { type: 'open_youtube', target: 'YouTube', rawQuery: query };
    }

    // WhatsApp Open Commands: "WhatsApp খোলো", "Open WhatsApp", "হোয়াটসঅ্যাপ খোলো"
    if (
      text.includes('whatsapp খোলো') ||
      text.includes('open whatsapp') ||
      text.includes('হোয়াটসঅ্যাপ খোলো') ||
      text.includes('ওপেন whatsapp') ||
      text.includes('whatsapp খুলে দাও') ||
      text.includes('হোয়াটসঅ্যাপ open')
    ) {
      return { type: 'open_whatsapp', target: 'WhatsApp', rawQuery: query };
    }

    // Chrome
    if (
      text.includes('ক্রোম খোলো') ||
      text.includes('open chrome') ||
      text.includes('ওপেন chrome') ||
      text.includes('ক্রোম open')
    ) {
      return { type: 'open_chrome', target: 'Google Chrome', rawQuery: query };
    }

    // Facebook
    if (
      text.includes('ফেসবুক খোলো') ||
      text.includes('open facebook') ||
      text.includes('ওপেন facebook') ||
      text.includes('ফেসবুক open')
    ) {
      return { type: 'open_facebook', target: 'Facebook', rawQuery: query };
    }

    // Messenger & Instagram generic
    if (text.includes('মেসেঞ্জার খোলো') || text.includes('open messenger')) {
      return { type: 'open_app', target: 'Messenger', rawQuery: query };
    }
    if (text.includes('ইনস্টাগ্রাম খোলো') || text.includes('open instagram')) {
      return { type: 'open_app', target: 'Instagram', rawQuery: query };
    }

    // Volume
    if (text.includes('ভলিউম বাড়াও') || text.includes('volume up') || text.includes('শব্দ বাড়াও')) {
      return { type: 'volume_up', details: 'up', rawQuery: query };
    }
    if (text.includes('ভলিউম কমাও') || text.includes('volume down') || text.includes('শব্দ কমাও')) {
      return { type: 'volume_down', details: 'down', rawQuery: query };
    }

    // Torch / Flashlight
    if (text.includes('টর্চ অন') || text.includes('টর্চ জ্বালাও') || text.includes('torch on') || text.includes('flashlight on')) {
      return { type: 'torch', details: 'on', rawQuery: query };
    }
    if (text.includes('টর্চ অফ') || text.includes('টর্চ নিভাও') || text.includes('torch off') || text.includes('flashlight off')) {
      return { type: 'torch', details: 'off', rawQuery: query };
    }

    // WhatsApp Message
    if (text.includes('whatsapp') || text.includes('হোয়াটসঅ্যাপ')) {
      if (text.includes('মেসেজ পাঠাও') || text.includes('send message') || text.includes('মেসেজ দাও')) {
        let recipient = 'মা';
        if (text.includes('বাবা')) recipient = 'বাবা';
        if (text.includes('বন্ধু')) recipient = 'বন্ধু';
        return { type: 'whatsapp_msg', target: recipient, rawQuery: query };
      }
    }

    // Phone Call
    if (text.includes('কল করো') || text.includes('ফোন করো') || text.includes('make a call') || text.includes('call')) {
      let recipient = 'মা';
      if (text.includes('বাবা')) recipient = 'বাবা';
      if (text.includes('ভাই')) recipient = 'ভাই';
      return { type: 'call', target: recipient, rawQuery: query };
    }

    return { type: 'none', rawQuery: query };
  }

  // --- Safe Methods ---

  public async openYouTube(): Promise<BridgeResult> {
    const bridge = this.getNativeBridge();
    if (bridge && typeof bridge.openYouTube === 'function') {
      try {
        const raw = bridge.openYouTube();
        const res = typeof raw === 'string' ? JSON.parse(raw) : raw;
        return {
          success: !!res.success,
          action: 'openYouTube',
          target: 'YouTube',
          status: res.success ? 'native_executed' : 'error',
          userMessageBn: res.message || (res.success ? 'YouTube ওপেন করা হচ্ছে...' : 'YouTube ইনস্টল করা নেই।'),
          userMessageEn: res.success ? 'Opening YouTube...' : 'YouTube is not installed.',
        };
      } catch (err: any) {
        return {
          success: false,
          action: 'openYouTube',
          target: 'YouTube',
          status: 'error',
          userMessageBn: 'YouTube খুলতে ত্রুটি হয়েছে।',
          userMessageEn: 'Error opening YouTube.',
          technicalDetails: String(err),
        };
      }
    }

    return {
      success: false,
      action: 'openYouTube',
      target: 'YouTube',
      status: 'preview_bridge_required',
      userMessageBn: 'Android Bridge required: YouTube অ্যাপ খোলার নির্দেশ গৃহীত হয়েছে। ব্রাউজার প্রিভিউতে সরাসরি অ্যান্ড্রয়েড অ্যাপ চালু করা সম্ভব নয়—নেটিভ অ্যান্ড্রয়েড ডিভাইসে এটি চালু হবে।',
      userMessageEn: 'Android Bridge required: YouTube launch intent prepared for native Android.',
      technicalDetails: 'Intent(ACTION_VIEW, Package: com.google.android.youtube)',
    };
  }

  public async openWhatsApp(): Promise<BridgeResult> {
    const bridge = this.getNativeBridge();
    if (bridge && typeof bridge.openWhatsApp === 'function') {
      try {
        const raw = bridge.openWhatsApp();
        const res = typeof raw === 'string' ? JSON.parse(raw) : raw;
        return {
          success: !!res.success,
          action: 'openWhatsApp',
          target: 'WhatsApp',
          status: res.success ? 'native_executed' : 'error',
          userMessageBn: res.message || (res.success ? 'WhatsApp ওপেন করা হচ্ছে...' : 'WhatsApp ইনস্টল করা নেই।'),
          userMessageEn: res.success ? 'Opening WhatsApp...' : 'WhatsApp is not installed.',
        };
      } catch (err: any) {
        return {
          success: false,
          action: 'openWhatsApp',
          target: 'WhatsApp',
          status: 'error',
          userMessageBn: 'WhatsApp খুলতে ত্রুটি হয়েছে।',
          userMessageEn: 'Error opening WhatsApp.',
          technicalDetails: String(err),
        };
      }
    }

    return {
      success: false,
      action: 'openWhatsApp',
      target: 'WhatsApp',
      status: 'preview_bridge_required',
      userMessageBn: 'Android Bridge required: WhatsApp অ্যাপ খোলার নির্দেশ গৃহীত হয়েছে। নেটিভ অ্যান্ড্রয়েড ডিভাইসে এটি সরাসরি চালু হবে।',
      userMessageEn: 'Android Bridge required: WhatsApp launch intent prepared for native Android.',
      technicalDetails: 'Intent(ACTION_VIEW, Package: com.whatsapp)',
    };
  }

  public async openChrome(): Promise<BridgeResult> {
    const bridge = this.getNativeBridge();
    if (bridge && typeof bridge.openChrome === 'function') {
      try {
        const raw = bridge.openChrome();
        const res = typeof raw === 'string' ? JSON.parse(raw) : raw;
        return {
          success: !!res.success,
          action: 'openChrome',
          target: 'Chrome',
          status: 'native_executed',
          userMessageBn: res.message || 'Google Chrome ওপেন করা হচ্ছে...',
          userMessageEn: 'Opening Chrome...',
        };
      } catch (err: any) {
        return {
          success: false,
          action: 'openChrome',
          target: 'Chrome',
          status: 'error',
          userMessageBn: 'Chrome খুলতে ত্রুটি হয়েছে।',
          userMessageEn: 'Error opening Chrome.',
          technicalDetails: String(err),
        };
      }
    }

    return {
      success: false,
      action: 'openChrome',
      target: 'Chrome',
      status: 'preview_bridge_required',
      userMessageBn: 'Android Bridge required: Google Chrome অ্যাপ চালু করার নির্দেশ গৃহীত হয়েছে।',
      userMessageEn: 'Android Bridge required: Launching Chrome.',
    };
  }

  public async openFacebook(): Promise<BridgeResult> {
    const bridge = this.getNativeBridge();
    if (bridge && typeof bridge.openFacebook === 'function') {
      try {
        const raw = bridge.openFacebook();
        const res = typeof raw === 'string' ? JSON.parse(raw) : raw;
        return {
          success: !!res.success,
          action: 'openFacebook',
          target: 'Facebook',
          status: 'native_executed',
          userMessageBn: res.message || 'Facebook ওপেন করা হচ্ছে...',
          userMessageEn: 'Opening Facebook...',
        };
      } catch (err: any) {
        return {
          success: false,
          action: 'openFacebook',
          target: 'Facebook',
          status: 'error',
          userMessageBn: 'Facebook খুলতে ত্রুটি হয়েছে।',
          userMessageEn: 'Error opening Facebook.',
          technicalDetails: String(err),
        };
      }
    }

    return {
      success: false,
      action: 'openFacebook',
      target: 'Facebook',
      status: 'preview_bridge_required',
      userMessageBn: 'Android Bridge required: Facebook ওপেন করার কমান্ড গৃহীত হয়েছে।',
      userMessageEn: 'Android Bridge required: Launching Facebook.',
    };
  }

  public async openApp(appName: string): Promise<BridgeResult> {
    const lower = appName.toLowerCase();
    if (lower.includes('youtube') || lower.includes('ইউটিউব')) return this.openYouTube();
    if (lower.includes('whatsapp') || lower.includes('হোয়াটসঅ্যাপ')) return this.openWhatsApp();
    if (lower.includes('chrome') || lower.includes('ক্রোম')) return this.openChrome();
    if (lower.includes('facebook') || lower.includes('ফেসবুক')) return this.openFacebook();

    return {
      success: false,
      action: 'openApp',
      target: appName,
      status: 'preview_bridge_required',
      userMessageBn: `Android Bridge required: ${appName} অ্যাপটি খোলার নির্দেশ গৃহীত হয়েছে। নেটিভ ডিভাইসে এটি সরাসরি চালু হবে।`,
      userMessageEn: `Android Bridge required: Launching ${appName}.`,
    };
  }

  public async scrollDown(): Promise<BridgeResult> {
    const bridge = this.getNativeBridge();
    if (bridge && typeof bridge.scrollDown === 'function') {
      try {
        const raw = bridge.scrollDown();
        const res = typeof raw === 'string' ? JSON.parse(raw) : raw;
        return {
          success: !!res.success,
          action: 'scrollDown',
          status: res.success ? 'native_executed' : 'error',
          userMessageBn: res.message || (res.success ? 'স্ক্রলিং সম্পন্ন হয়েছে।' : 'ArshiAI Automation চালানোর জন্য Accessibility Service চালু করুন।'),
          userMessageEn: res.success ? 'Scrolled down successfully.' : 'Please enable Accessibility Service for automation.',
        };
      } catch (err: any) {
        return {
          success: false,
          action: 'scrollDown',
          status: 'error',
          userMessageBn: 'স্ক্রলিং ব্যর্থ হয়েছে।',
          userMessageEn: 'Scroll failed.',
          technicalDetails: String(err),
        };
      }
    }

    return {
      success: false,
      action: 'scrollDown',
      status: 'preview_bridge_required',
      userMessageBn: 'ArshiAI Automation চালানোর জন্য Accessibility Service চালু করুন। (ব্রাউজার প্রিভিউতে স্ক্রলিং অনুকরণ সীমাবদ্ধ)',
      userMessageEn: 'ArshiAI Automation requires Accessibility Service to be enabled.',
      technicalDetails: 'AccessibilityService.dispatchGesture(SwipePath down)',
    };
  }

  public async scroll(direction: 'up' | 'down'): Promise<BridgeResult> {
    return this.scrollDown();
  }

  public async setVolumeUp(): Promise<BridgeResult> {
    const bridge = this.getNativeBridge();
    if (bridge && typeof bridge.setVolumeUp === 'function') {
      try {
        const raw = bridge.setVolumeUp();
        const res = typeof raw === 'string' ? JSON.parse(raw) : raw;
        return {
          success: !!res.success,
          action: 'setVolumeUp',
          status: 'native_executed',
          userMessageBn: res.message || 'ভলিউম বাড়ানো হয়েছে।',
          userMessageEn: 'Volume increased.',
        };
      } catch (err) {
        // Fallback
      }
    }

    return {
      success: false,
      action: 'setVolumeUp',
      status: 'preview_bridge_required',
      userMessageBn: 'Android Bridge required: ডিভাইসের ভলিউম বাড়ানোর জন্য অডিও ম্যানেজার ব্রিজ প্রয়োজন।',
      userMessageEn: 'Android Bridge required: AudioManager stream control requires Android Bridge.',
    };
  }

  public async setVolumeDown(): Promise<BridgeResult> {
    const bridge = this.getNativeBridge();
    if (bridge && typeof bridge.setVolumeDown === 'function') {
      try {
        const raw = bridge.setVolumeDown();
        const res = typeof raw === 'string' ? JSON.parse(raw) : raw;
        return {
          success: !!res.success,
          action: 'setVolumeDown',
          status: 'native_executed',
          userMessageBn: res.message || 'ভলিউম কমানো হয়েছে।',
          userMessageEn: 'Volume decreased.',
        };
      } catch (err) {
        // Fallback
      }
    }

    return {
      success: false,
      action: 'setVolumeDown',
      status: 'preview_bridge_required',
      userMessageBn: 'Android Bridge required: ডিভাইসের ভলিউম কমানোর জন্য অডিও ম্যানেজার ব্রিজ প্রয়োজন।',
      userMessageEn: 'Android Bridge required: AudioManager stream control requires Android Bridge.',
    };
  }

  public async setVolume(direction: 'up' | 'down' | 'mute' | number): Promise<BridgeResult> {
    return direction === 'up' ? this.setVolumeUp() : this.setVolumeDown();
  }

  public async toggleFlashlight(state?: 'on' | 'off' | 'toggle'): Promise<BridgeResult> {
    const bridge = this.getNativeBridge();
    if (bridge && typeof bridge.toggleFlashlight === 'function') {
      try {
        const raw = bridge.toggleFlashlight();
        const res = typeof raw === 'string' ? JSON.parse(raw) : raw;
        return {
          success: !!res.success,
          action: 'toggleFlashlight',
          status: 'native_executed',
          userMessageBn: res.message || 'ফ্ল্যাশলাইট টগল করা হয়েছে।',
          userMessageEn: 'Flashlight toggled.',
        };
      } catch (err) {
        // Fallback
      }
    }

    return {
      success: false,
      action: 'toggleFlashlight',
      target: state,
      status: 'preview_bridge_required',
      userMessageBn: `Android Bridge required: টর্চ (${state || 'টগল'}) করার জন্য Android CameraManager ফ্ল্যাশলাইট ব্রিজ প্রয়োজন।`,
      userMessageEn: 'Android Bridge required: Flashlight control requires CameraManager.setTorchMode.',
    };
  }

  public async makePhoneCall(recipient: string): Promise<BridgeResult> {
    const bridge = this.getNativeBridge();
    if (bridge && typeof bridge.makePhoneCall === 'function') {
      try {
        const raw = bridge.makePhoneCall(recipient);
        const res = typeof raw === 'string' ? JSON.parse(raw) : raw;
        return {
          success: !!res.success,
          action: 'makePhoneCall',
          target: recipient,
          status: 'native_executed',
          userMessageBn: res.message || `${recipient}-কে ফোন কল করা হচ্ছে...`,
          userMessageEn: `Calling ${recipient}...`,
        };
      } catch (err) {
        // Fallback
      }
    }

    return {
      success: false,
      action: 'makePhoneCall',
      target: recipient,
      status: 'preview_bridge_required',
      userMessageBn: `Android Bridge required: ${recipient}-কে কল করার কমান্ড প্রস্তুত। ব্রাউজারে টেলিকমিউনিকেশন পারমিশন নেই—নেটিভ অ্যাপে কল শুরু হবে।`,
      userMessageEn: `Android Bridge required: Phone call initiation requires Android TelecomManager.`,
    };
  }

  public async makeCall(recipient: string): Promise<BridgeResult> {
    return this.makePhoneCall(recipient);
  }

  public async sendSMS(recipient: string, message?: string): Promise<BridgeResult> {
    const bridge = this.getNativeBridge();
    if (bridge && typeof bridge.sendSMS === 'function') {
      try {
        const raw = bridge.sendSMS(recipient, message || '');
        const res = typeof raw === 'string' ? JSON.parse(raw) : raw;
        return {
          success: !!res.success,
          action: 'sendSMS',
          target: recipient,
          status: 'native_executed',
          userMessageBn: res.message || `${recipient}-কে SMS প্রস্তুত করা হয়েছে।`,
          userMessageEn: `SMS prepared for ${recipient}.`,
        };
      } catch (err) {
        // Fallback
      }
    }

    return {
      success: false,
      action: 'sendSMS',
      target: recipient,
      status: 'preview_bridge_required',
      userMessageBn: `Android Bridge required: ${recipient}-কে SMS প্রেরণের জন্য এসএমএস ম্যানেজার ব্রিজ প্রয়োজন।`,
      userMessageEn: 'Android Bridge required: SmsManager integration needed.',
    };
  }

  public async sendWhatsAppMessage(recipient: string, message?: string): Promise<BridgeResult> {
    const bridge = this.getNativeBridge();
    if (bridge && typeof bridge.sendWhatsAppMessage === 'function') {
      try {
        const raw = bridge.sendWhatsAppMessage(recipient, message || '');
        const res = typeof raw === 'string' ? JSON.parse(raw) : raw;
        return {
          success: !!res.success,
          action: 'sendWhatsAppMessage',
          target: recipient,
          status: 'native_executed',
          userMessageBn: res.message || `${recipient}-কে WhatsApp বার্তা পাঠানো হচ্ছে...`,
          userMessageEn: `Sending WhatsApp message to ${recipient}...`,
        };
      } catch (err) {
        // Fallback
      }
    }

    return {
      success: false,
      action: 'sendWhatsAppMessage',
      target: recipient,
      status: 'preview_bridge_required',
      userMessageBn: `Android Bridge required: ${recipient}-কে WhatsApp-এ বার্তা পাঠানোর নির্দেশ গৃহীত হয়েছে। নেটিভ অ্যাপে এটি অটোমেশনের মাধ্যমে সেন্ড হবে।`,
      userMessageEn: 'Android Bridge required: WhatsApp automation requires native Android Bridge.',
    };
  }

  public getCurrentTimeFormatted(): { bengaliText: string; englishText: string } {
    const now = new Date();
    const hours = now.getHours();
    const minutes = now.getMinutes();
    const ampm = hours >= 12 ? 'বিকাল' : 'সকাল';
    const hour12 = hours % 12 || 12;

    const bnDigits = ['০', '১', '২', '৩', '৪', '৫', '৬', '৭', '৮', '৯'];
    const toBnNum = (n: number) =>
      String(n)
        .split('')
        .map((d) => bnDigits[Number(d)] ?? d)
        .join('');

    const formattedMinutesBn = minutes < 10 ? '০' + toBnNum(minutes) : toBnNum(minutes);
    const bengaliText = `এখন সময় ${ampm} ${toBnNum(hour12)}টা বেজে ${formattedMinutesBn} মিনিট।`;
    const englishText = `The current time is ${now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}.`;

    return { bengaliText, englishText };
  }
}

export const androidBridge = new AndroidBridgeArchitecture();
