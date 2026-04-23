import i18n from "i18next";
import { initReactI18next } from "react-i18next";

const resources = {
  en: { translation: { helpComing: "Help is coming. Stay calm." } },
  hi: { translation: { helpComing: "मदद आ रही है। शांत रहें।" } },
  bn: { translation: { helpComing: "সহায়তা আসছে। শান্ত থাকুন।" } },
  ta: { translation: { helpComing: "உதவி வருகிறது. அமைதியாக இருங்கள்." } },
  or: { translation: { helpComing: "ସହାୟତା ଆସୁଛି। ଶାନ୍ତ ରୁହନ୍ତୁ।" } }
};

i18n.use(initReactI18next).init({
  resources,
  lng: "en",
  fallbackLng: "en",
  interpolation: { escapeValue: false }
});

export default i18n;
