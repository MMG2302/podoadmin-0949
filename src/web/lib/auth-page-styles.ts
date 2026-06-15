/** Clases compartidas para login, registro y otras pantallas públicas (soportan modo oscuro). */
export const authPage = {
  shell: "min-h-screen bg-white dark:bg-gray-950 flex overflow-hidden",
  formColumn: "w-full lg:w-1/2 flex flex-col dark:bg-gray-900",
  formColumnScroll: "w-full lg:w-1/2 flex flex-col h-screen min-h-0 overflow-y-auto dark:bg-gray-900",
  heading: "text-[#1a1a1a] dark:text-white text-3xl font-semibold mb-2",
  subheading: "text-gray-500 dark:text-gray-400",
  mobileLogo: "text-[#1a1a1a] dark:text-white text-4xl font-light tracking-tight",
  label: "block text-sm font-medium text-[#1a1a1a] dark:text-gray-100 mb-2",
  labelTight: "block text-sm font-medium text-[#1a1a1a] dark:text-gray-100 mb-1",
  hint: "text-xs text-gray-500 dark:text-gray-400 mb-2",
  input:
    "w-full px-4 py-3.5 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg text-[#1a1a1a] dark:text-white placeholder:text-gray-400 dark:placeholder:text-gray-500 focus:outline-none focus:border-[#1a1a1a] dark:focus:border-gray-400 focus:ring-1 focus:ring-[#1a1a1a] dark:focus:ring-gray-400",
  inputWithIcon: "w-full px-4 py-3.5 pr-11 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg text-[#1a1a1a] dark:text-white placeholder:text-gray-400 dark:placeholder:text-gray-500 focus:outline-none focus:border-[#1a1a1a] dark:focus:border-gray-400 focus:ring-1 focus:ring-[#1a1a1a] dark:focus:ring-gray-400",
  termsBox:
    "flex items-start gap-3 cursor-pointer rounded-lg border-2 border-gray-200 dark:border-gray-600 bg-gray-50 dark:bg-gray-800/80 p-4 hover:border-gray-300 dark:hover:border-gray-500 transition-colors has-[:checked]:border-[#1a1a1a] dark:has-[:checked]:border-gray-300 has-[:checked]:bg-white dark:has-[:checked]:bg-gray-800",
  primaryBtn:
    "w-full py-3.5 bg-[#1a1a1a] dark:bg-white text-white dark:text-[#1a1a1a] font-medium rounded-lg hover:bg-[#2a2a2a] dark:hover:bg-gray-200 transition-all disabled:opacity-50 disabled:cursor-not-allowed relative overflow-hidden",
  link: "text-[#1a1a1a] dark:text-gray-200 font-medium hover:underline",
  muted: "text-sm text-gray-500 dark:text-gray-400",
  bodyText: "text-sm text-gray-600 dark:text-gray-300",
  error:
    "bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-300 px-4 py-3 rounded-lg text-sm",
  amber:
    "rounded-lg border border-amber-200 dark:border-amber-800 bg-amber-50 dark:bg-amber-950/30 px-4 py-3 text-sm text-amber-900 dark:text-amber-200",
  spinner: "animate-spin h-8 w-8 text-[#1a1a1a] dark:text-white",
  dividerLine: "bg-white dark:bg-gray-900 px-2 text-gray-400 dark:text-gray-500",
  googleBtn:
    "w-full py-3.5 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 text-[#1a1a1a] dark:text-white font-medium rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-all disabled:opacity-50 flex items-center justify-center gap-2",
} as const;
