/** @type {import('tailwindcss').Config} */
module.exports = {
    content: [
        './app/**/*.{js,ts,jsx,tsx}',
        './pages/**/*.{js,ts,jsx,tsx}',
        './components/**/*.{js,ts,jsx,tsx}',
    ],
    theme: {
        extend: {
            colors: {
                'surface-100': '#f4f4f5',
                'surface-200': '#e4e4e7',
                'primary-500': '#3b82f6',
            },
            fontFamily: {
                'georgia': ['Georgia', 'serif'],
                'pacifico': ['Pacifico', 'cursive'],
                'roboto': ['Roboto', 'sans-serif'],
                'dancing': ['Dancing Script', 'cursive'],
            }
        },
    },
    plugins: [],
}