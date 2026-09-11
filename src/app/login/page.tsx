import { FrenteReset } from "@/store";
import CardLogin from "./components/CardLogin";
import CONFIG from "@/config";

export default function Login() {
  return (
    <main className="container my-10">
      <h1 className="text-center text-4xl font-semibold">{CONFIG.branding.loginTitle}</h1>
      <div className="w-full flex justify-center mt-6">
        <CardLogin />
      </div>
      <FrenteReset />
    </main>
  );
}
