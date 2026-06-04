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
    socialProfiles: {
      title: "Social Profiles",
      hint: "Help us get to know you better. LinkedIn is required.",
      linkedinLabel: "LinkedIn",
      linkedinPlaceholder: "https://linkedin.com/in/your-profile",
      twitterLabel: "Twitter / X (Optional)",
      twitterPlaceholder: "https://twitter.com/yourhandle",
      facebookLabel: "Facebook (Optional)",
      facebookPlaceholder: "https://facebook.com/yourprofile",
      githubLabel: "GitHub (Optional)",
      githubPlaceholder: "https://github.com/yourusername",
      portfolioLabel: "Portfolio / Website (Optional)",
      portfolioPlaceholder: "https://yourwebsite.com",
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
