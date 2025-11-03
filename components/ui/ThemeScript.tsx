/**
 * ThemeScript component
 * Injects a blocking script to prevent theme flickering (FOUC)
 * This must run before React hydration to apply the saved theme
 */
export default function ThemeScript() {
  return (
    <script
      dangerouslySetInnerHTML={{
        __html: `
          (function() {
            try {
              var theme = localStorage.getItem('app-theme') || 'terracotta';
              document.documentElement.setAttribute('data-theme', theme);
            } catch (e) {}
          })();
        `,
      }}
    />
  );
}
