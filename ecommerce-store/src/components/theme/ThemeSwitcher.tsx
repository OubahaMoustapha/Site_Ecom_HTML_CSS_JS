import type { ChangeEvent } from "react";

function ThemeSwitcher() {
  const handleChange = (event: ChangeEvent<HTMLSelectElement>) => {
    document.documentElement.dataset.theme = event.target.value;
  };

  return (
    <select
      defaultValue="light"
      onChange={handleChange}
      aria-label="Select theme"
    >
      <option value="light">Light</option>
      <option value="dark">Dark</option>
      <option value="feminine">Feminine</option>
      <option value="masculine">Masculine</option>
      <option value="system">System</option>
    </select>
  );
}

export default ThemeSwitcher;