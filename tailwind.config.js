module.exports = {
    content: [
      // Specify the paths to all of your template files
      "./components/**/*.{vue,js,ts}",
      "./layouts/**/*.vue",
      "./pages/**/*.vue",
      "./plugins/**/*.{js,ts}",
      "./nuxt.config.{js,ts}",
      "./node_modules/flowbite/**/*.js" // Include Flowbite's JavaScript files
    ],
    theme: {
      extend: {
        // Extend your theme here if needed
      },
    },
    plugins: [
      require('flowbite/plugin') // Integrate Flowbite as a Tailwind CSS plugin
    ],
  }