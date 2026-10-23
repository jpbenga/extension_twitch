"use client";
import { useState } from "react";
import {
  Button,
  IconButton,
  Card,
  Panel,
  Badge,
  Alert,
  Input,
  Select,
  Checkbox,
  Accordion,
  EmptyState,
  LoadingState,
  SegmentedControl,
  type Tone,
} from "./primitives";
import { useConfirm, useToast } from "./feedback";
const variants: Tone[] = [
  "primary",
  "secondary",
  "neutral",
  "success",
  "warning",
  "danger",
  "vote",
  "info",
  "quiet",
];
export function DesignCatalog() {
  const confirm = useConfirm(),
    notify = useToast();
  const [count, setCount] = useState(0),
    [tab, setTab] = useState("gm");
  async function example(
    tone: "neutral" | "warning" | "danger",
    asynchronous = false,
  ) {
    await confirm({
      title:
        tone === "danger"
          ? "Supprimer cette règle ?"
          : "Recommencer la partie ?",
      description:
        tone === "danger"
          ? "Cette règle sera retirée de votre création."
          : "Les votes et résultats seront effacés. Les joueurs conserveront leur accès à cette partie.",
      confirmLabel: tone === "danger" ? "Supprimer" : "Recommencer",
      tone,
      onConfirm: async () => {
        if (asynchronous) {
          const response = await fetch("/api/server/health");
          if (!response.ok)
            throw new Error(
              "La connexion est indisponible. Votre travail est conservé. Réessayez.",
            );
        }
        setCount((c) => c + 1);
        notify("Exemple confirmé.");
      },
    });
  }
  return (
    <main className="design-catalog">
      <h1>Broadcast Neon</h1>
      <p>
        Catalogue de composants · Développement uniquement. Ces exemples ne
        modifient aucune partie.
      </p>
      <Panel>
        <h2>Actions et états</h2>
        <div className="design-samples">
          {variants.map((v) => (
            <Button key={v} variant={v} onClick={() => notify(`Variante ${v}`)}>
              {v}
            </Button>
          ))}
        </div>
        <Button disabled>Action indisponible</Button>
        <Button loading>Enregistrement</Button>
        <IconButton label="Aperçu du plateau" variant="info">
          ▣
        </IconButton>
        <div className="design-samples">
          {variants.slice(0, 8).map((v) => (
            <Badge key={v} tone={v}>
              {v}
            </Badge>
          ))}
        </div>
      </Panel>
      <Panel>
        <h2>Dialogues</h2>
        <div className="design-samples">
          <Button onClick={() => void example("neutral")}>
            Confirmation neutre
          </Button>
          <Button variant="warning" onClick={() => void example("warning")}>
            Confirmation importante
          </Button>
          <Button variant="danger" onClick={() => void example("danger")}>
            Confirmation destructive
          </Button>
          <Button
            variant="secondary"
            onClick={() => void example("warning", true)}
          >
            Confirmation asynchrone
          </Button>
        </div>
        <p data-testid="confirmation-count">Confirmations : {count}</p>
      </Panel>
      <Panel>
        <h2>Formulaires et navigation</h2>
        <div className="studio-grid">
          <label>
            Nom du jeu
            <Input placeholder="Mon émission" />
          </label>
          <label>
            Point de vue
            <Select>
              <option>Game Master</option>
              <option>Joueur</option>
            </Select>
          </label>
          <label className="creator-check">
            <Checkbox />
            Autoriser la participation
          </label>
        </div>
        <SegmentedControl
          label="Exemple de navigation"
          options={[
            { value: "gm", label: "Game Master" },
            { value: "player", label: "Joueur" },
            { value: "public", label: "Spectateur" },
          ]}
          value={tab}
          onChange={setTab}
        />
        <p>Vue choisie : {tab}</p>
        <Accordion title="Détails avancés">
          <p>Informations secondaires accessibles au clavier.</p>
        </Accordion>
      </Panel>
      <Card>
        <h2>Feedback</h2>
        <Alert tone="success">Votre participation est enregistrée.</Alert>
        <Alert tone="info">
          Le plateau contient les informations publiques.
        </Alert>
        <Alert tone="warning">Certains joueurs n’ont pas encore voté.</Alert>
        <Alert tone="danger">
          Cette action est refusée. Vérifiez la phase de jeu.
        </Alert>
        <LoadingState />
        <EmptyState title="Aucune partie en cours">
          Choisissez un jeu pour préparer votre émission.
        </EmptyState>
      </Card>
    </main>
  );
}
