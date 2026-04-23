import { useTranslation } from "react-i18next";

const options = ["en", "hi", "bn", "ta", "or"];

export default function LanguageSwitcher() {
  const { i18n } = useTranslation();

  return (
    <select
      value={i18n.language}
      className="glass rounded-lg px-3 py-2 text-sm"
      onChange={(e) => i18n.changeLanguage(e.target.value)}
    >
      {options.map((lang) => (
        <option key={lang} value={lang}>
          {lang.toUpperCase()}
        </option>
      ))}
    </select>
  );
}
