import polandFlag from "../assets/poland.png";
import unitedStatesFlag from "../assets/united-states.png";
import italyFlag from "../assets/italy.svg";
import germanFlag from "../assets/germany.svg";

// One list for login and the authenticated shell keeps language choices in sync.
export const LANGUAGE_OPTIONS = [
  { code: "pl", label: "PL", flag: polandFlag },
  { code: "en", label: "EN", flag: unitedStatesFlag },
  { code: "it", label: "IT", flag: italyFlag },
  { code: "de", label: "DE", flag: germanFlag }
];
