import { extendTheme } from '@chakra-ui/react';

const theme = extendTheme({
  colors: {
    brand: {
      navy: '#07111F',
      navy2: '#08111E',
      cream: '#FAF7F0',
      card: '#FFFDF8',
      gold: '#D6A84F',
      goldDark: '#A97721',
      text: '#111827',
      muted: '#6B7280',
      success: '#2F9E44',
      danger: '#D64545',
      purple: '#7C5CFF',
      blue: '#3B82F6',
    },
  },
  fonts: {
    heading: 'Georgia, Cambria, "Times New Roman", serif',
    body: 'Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
  },
  styles: {
    global: {
      body: {
        bg: 'brand.cream',
        color: 'brand.text',
      },
    },
  },
  components: {
    Button: {
      baseStyle: {
        borderRadius: '10px',
        fontWeight: 700,
      },
    },
  },
});

export default theme;
