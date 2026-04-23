import { motion } from "framer-motion";
import Card from "../components/ui/Card";
import useAppStore from "../store/useAppStore";

export default function Home() {
  const metrics = useAppStore((s) => s.metrics);

  return (
    <motion.main initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="mx-auto max-w-7xl p-4">
      <section className="rounded-3xl border border-border bg-grid bg-[size:24px_24px] p-6">
        <h2 className="font-heading text-4xl">AI-Powered Disaster Response OS</h2>
        <p className="mt-3 max-w-2xl text-muted">SankatSahay unifies SOS, geospatial intelligence, family reunification, and transparent AI decisions.</p>
      </section>

      <section className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <Card><p className="text-muted">SOS alerts resolved</p><p className="font-mono text-3xl">{metrics.sosResolved}</p></Card>
        <Card><p className="text-muted">Volunteers deployed</p><p className="font-mono text-3xl">{metrics.volunteersDeployed}</p></Card>
        <Card><p className="text-muted">Families reunited</p><p className="font-mono text-3xl">{metrics.familiesReunited}</p></Card>
        <Card><p className="text-muted">Resources dispatched</p><p className="font-mono text-3xl">{metrics.resourcesDispatched}</p></Card>
      </section>

      <section className="mt-5 grid gap-4 lg:grid-cols-2">
        <Card>
          <h3 className="font-heading text-xl">Powered by</h3>
          <p className="mt-2 text-muted">NVIDIA NIM, GDACS, OpenWeatherMap, OpenStreetMap</p>
        </Card>
        <Card>
          <h3 className="font-heading text-xl">Privacy First</h3>
          <p className="mt-2 text-muted">Face data processed locally. No biometric storage. GDPR deletion ready.</p>
        </Card>
      </section>
    </motion.main>
  );
}
