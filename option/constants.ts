export interface FrameworkOption {
  id: string;
  name: string;
  subtitle: string;
  icon: string;
  accent: string;
}

export const FRAMEWORKS: FrameworkOption[] = [
  {
    id: "javas",
    name: "Selenium Java",
    subtitle: "Standard Java WebDriver actions",
    icon: "☕",
    accent: "24, 95%, 52%",
  },
  {
    id: "playwrightJS",
    name: "Playwright (Node)",
    subtitle: "Modern JS/TS test framework",
    icon: "🎭",
    accent: "168, 100%, 40%",
  },
  {
    id: "playwrightJava",
    name: "Playwright (Java)",
    subtitle: "Java bindings for Playwright API",
    icon: "🚀",
    accent: "200, 100%, 50%",
  },
  {
    id: "py",
    name: "Selenium Python",
    subtitle: "Python bindings for Selenium",
    icon: "🐍",
    accent: "45, 100%, 48%",
  },
  {
    id: "csharp",
    name: "Selenium C#",
    subtitle: "C# .NET driver actions",
    icon: "🎯",
    accent: "265, 100%, 65%",
  },
  {
    id: "protractorjs",
    name: "Protractor (Angular)",
    subtitle: "Angular E2E automation library",
    icon: "🛡️",
    accent: "350, 100%, 60%",
  },
  {
    id: "cypress",
    name: "Cypress",
    subtitle: "Developer-friendly web test runner",
    icon: "🌲",
    accent: "160, 100%, 40%",
  },
  {
    id: "custom",
    name: "Custom Framework",
    subtitle: "Define your own POM structures",
    icon: "🛠️",
    accent: "38, 92%, 50%",
  },
];
