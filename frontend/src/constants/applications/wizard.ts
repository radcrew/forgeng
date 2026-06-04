/** User-facing copy for the multi-step apply wizard. */
export const APPLICATION_WIZARD_COPY = {
  backToHome: "← Back to Home",
  pageTitle: "Apply to Forgeng",
  stepIndicator: (step: number, total: number) => `Step ${step} of ${total}`,
  steps: {
    basicInfo: {
      title: "Basic Information",
      accountHint:
        "You're applying with your Forgeng account. We'll use these details — update them in your profile if they need to change.",
      nameLabel: "Name",
      emailLabel: "Email",
    },
    background: {
      title: "Your Background",
      backgroundLabel: "Tell us about yourself",
      backgroundPlaceholder:
        "Where are you coming from? What have you been learning?",
      experienceLabel: "Technical Experience (Optional)",
      experiencePlaceholder:
        "Any programming languages, tools, or projects you've worked with?",
    },
    motivation: {
      title: "Motivation",
      motivationLabel: "Why do you want to join this program?",
      motivationPlaceholder:
        "What are your goals? How will this apprenticeship help you achieve them?",
    },
    videoIntro: {
      title: "Video Introduction",
      hint: "Record a short video (up to 30 seconds) introducing yourself.",
      recordLabel: "Start Recording",
      stopLabel: "Stop",
      rerecordLabel: "Re-record",
      countdownLabel: (s: number) => `Recording — ${s}s left`,
      uploadingLabel: "Uploading...",
      doneLabel: "Video uploaded",
      errorLabel: "Something went wrong. Please try again.",
      permissionDenied:
        "Camera or microphone access was denied. Please allow access in your browser and try again.",
      unsupported:
        "Your browser does not support video recording. Try Chrome or Firefox.",
    },
    wallets: {
      title: "Wallet Addresses",
      hint: "Stipends are paid in crypto. Provide at least one address — you will be paid on whichever chain we agree on.",
      evmLabel: "EVM Address",
      evmDescription: "Covers Ethereum, BNB Chain, Base, Arbitrum, Optimism, and all other EVM-compatible networks. Starts with 0x.",
      evmPlaceholder: "0x...",
      solanaLabel: "Solana Address (Optional)",
      solanaDescription: "Your Solana wallet address (44 characters, Base58).",
      solanaPlaceholder: "e.g. 7xKX...",
      tronLabel: "Tron Address (Optional)",
      tronDescription: "Your Tron wallet address. Starts with T.",
      tronPlaceholder: "T...",
      atLeastOneHint: "At least one address is required.",
    },
    socialProfiles: {
      title: "Social Profiles",
      hint: "Help us get to know you better. LinkedIn and GitHub are required.",
      linkedinLabel: "LinkedIn",
      linkedinPlaceholder: "https://linkedin.com/in/your-profile",
      twitterLabel: "Twitter / X (Optional)",
      twitterPlaceholder: "https://twitter.com/yourhandle",
      facebookLabel: "Facebook (Optional)",
      facebookPlaceholder: "https://facebook.com/yourprofile",
      githubLabel: "GitHub",
      githubPlaceholder: "https://github.com/yourusername",
      portfolioLabel: "Portfolio / Website (Optional)",
      portfolioPlaceholder: "https://yourwebsite.com",
      telegramLabel: "Telegram (Optional)",
      telegramPlaceholder: "@username or https://t.me/you",
      whatsappLabel: "WhatsApp (Optional)",
      whatsappPlaceholder: "+1234567890",
      addressLabel: "Address (Optional)",
      addressPlaceholder: "Street, City, Country",
    },
  },
  actions: {
    back: "Back",
    next: "Next Step",
    submitting: "Submitting...",
    submit: "Submit Application",
  },
  toast: {
    submitSuccess: "Application submitted",
    submitSuccessDescription: "Thanks — we'll be in touch soon.",
    alreadySubmitted: "You've already submitted an application.",
    submitError: "Could not submit your application. Please try again.",
  },
} as const;
