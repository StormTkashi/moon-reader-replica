import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Slider } from "@/components/ui/slider";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  FONT_FAMILIES,
  READER_THEMES,
  useReaderSettings,
  type TapAction,
} from "@/lib/reader-settings";

const TAP_ACTIONS: { value: TapAction; label: string }[] = [
  { value: "next", label: "Próxima página" },
  { value: "prev", label: "Página anterior" },
  { value: "menu", label: "Abrir menu" },
  { value: "bookmark", label: "Marcar página" },
  { value: "autoscroll", label: "Rolagem automática" },
  { value: "theme", label: "Alternar tema" },
  { value: "none", label: "Nada" },
];

function Row({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between gap-4 py-2">
      <Label className="text-sm font-normal text-muted-foreground">{label}</Label>
      {children}
    </div>
  );
}

export function SettingsPanel() {
  const s = useReaderSettings();

  return (
    <Tabs defaultValue="theme" className="w-full">
      <TabsList className="w-full">
        <TabsTrigger value="theme" className="flex-1">
          Tema
        </TabsTrigger>
        <TabsTrigger value="text" className="flex-1">
          Texto
        </TabsTrigger>
        <TabsTrigger value="page" className="flex-1">
          Página
        </TabsTrigger>
        <TabsTrigger value="gestures" className="flex-1">
          Gestos
        </TabsTrigger>
      </TabsList>

      <TabsContent value="theme" className="pt-2">
        <div className="grid grid-cols-3 gap-2">
          {READER_THEMES.map((t) => (
            <button
              key={t.id}
              onClick={() => s.set({ themeId: t.id })}
              className={`rounded-lg border p-3 text-left text-xs ${
                s.themeId === t.id ? "border-primary" : "border-border"
              }`}
              style={{ background: t.bg, color: t.fg }}
            >
              {t.name}
            </button>
          ))}
          <button
            onClick={() => s.set({ themeId: "custom" })}
            className={`rounded-lg border p-3 text-left text-xs ${
              s.themeId === "custom" ? "border-primary" : "border-border"
            }`}
            style={{ background: s.customBg, color: s.customFg }}
          >
            Personalizado
          </button>
        </div>
        {s.themeId === "custom" && (
          <div className="mt-3 flex gap-4">
            <label className="flex items-center gap-2 text-sm text-muted-foreground">
              Fundo
              <input
                type="color"
                value={s.customBg}
                onChange={(e) => s.set({ customBg: e.target.value })}
                className="h-8 w-10 rounded border border-border bg-transparent"
              />
            </label>
            <label className="flex items-center gap-2 text-sm text-muted-foreground">
              Texto
              <input
                type="color"
                value={s.customFg}
                onChange={(e) => s.set({ customFg: e.target.value })}
                className="h-8 w-10 rounded border border-border bg-transparent"
              />
            </label>
          </div>
        )}
        <Row label={`Brilho ${Math.round(s.brightness * 100)}%`}>
          <Slider
            className="w-40"
            min={20}
            max={100}
            value={[s.brightness * 100]}
            onValueChange={(vals) => s.set({ brightness: (vals[0] ?? 0) / 100 })}
          />
        </Row>
      </TabsContent>

      <TabsContent value="text" className="pt-2">
        <Row label="Fonte">
          <Select value={s.fontFamily} onValueChange={(v) => s.set({ fontFamily: v })}>
            <SelectTrigger className="w-44">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {FONT_FAMILIES.map((f) => (
                <SelectItem key={f.id} value={f.id}>
                  {f.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </Row>
        <Row label={`Tamanho ${s.fontSize}px`}>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={() => s.set({ fontSize: Math.max(12, s.fontSize - 1) })}>
              A-
            </Button>
            <Button variant="outline" size="sm" onClick={() => s.set({ fontSize: Math.min(40, s.fontSize + 1) })}>
              A+
            </Button>
          </div>
        </Row>
        <Row label={`Entrelinha ${s.lineHeight.toFixed(1)}`}>
          <Slider
            className="w-40"
            min={10}
            max={26}
            value={[s.lineHeight * 10]}
            onValueChange={(vals) => s.set({ lineHeight: (vals[0] ?? 0) / 10 })}
          />
        </Row>
        <Row label={`Margens ${s.margin}px`}>
          <Slider
            className="w-40"
            min={0}
            max={72}
            value={[s.margin]}
            onValueChange={(vals) => s.set({ margin: vals[0] ?? 0 })}
          />
        </Row>
        <Row label={`Espaço entre letras ${s.letterSpacing}px`}>
          <Slider
            className="w-40"
            min={0}
            max={4}
            step={0.5}
            value={[s.letterSpacing]}
            onValueChange={(vals) => s.set({ letterSpacing: vals[0] ?? 0 })}
          />
        </Row>
        <Row label="Justificar">
          <Switch
            checked={s.align === "justify"}
            onCheckedChange={(v) => s.set({ align: v ? "justify" : "left" })}
          />
        </Row>
        <Row label="Negrito">
          <Switch checked={s.bold} onCheckedChange={(v) => s.set({ bold: v })} />
        </Row>
      </TabsContent>

      <TabsContent value="page" className="pt-2">
        <Row label="Modo de leitura">
          <Select value={s.pageMode} onValueChange={(v) => s.set({ pageMode: v as "paged" | "scroll" })}>
            <SelectTrigger className="w-44">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="paged">Paginado</SelectItem>
              <SelectItem value="scroll">Rolagem</SelectItem>
            </SelectContent>
          </Select>
        </Row>
        <Row label="Animação de virada">
          <Select
            value={s.animation}
            onValueChange={(v) => s.set({ animation: v as "curl" | "slide" | "fade" | "none" })}
          >
            <SelectTrigger className="w-44">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="curl">Folhagem (virar página)</SelectItem>
              <SelectItem value="slide">Deslizar</SelectItem>
              <SelectItem value="fade">Esmaecer</SelectItem>
              <SelectItem value="none">Sem animação</SelectItem>
            </SelectContent>
          </Select>
        </Row>
        <Row label={`Velocidade da rolagem automática ${s.autoScrollSpeed}`}>
          <Slider
            className="w-40"
            min={5}
            max={120}
            value={[s.autoScrollSpeed]}
            onValueChange={(vals) => s.set({ autoScrollSpeed: vals[0] ?? 0 })}
          />
        </Row>
        <Row label="Barra de status na leitura">
          <Switch checked={s.showStatusBar} onCheckedChange={(v) => s.set({ showStatusBar: v })} />
        </Row>
        <Row label="Tela cheia">
          <Switch checked={s.fullscreen} onCheckedChange={(v) => s.set({ fullscreen: v })} />
        </Row>
        <Row label="Manter tela ligada">
          <Switch checked={s.keepAwake} onCheckedChange={(v) => s.set({ keepAwake: v })} />
        </Row>
        <Row label="Travar orientação">
          <Select
            value={s.orientationLock}
            onValueChange={(v) => s.set({ orientationLock: v as "auto" | "portrait" | "landscape" })}
          >
            <SelectTrigger className="w-44">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="auto">Automática</SelectItem>
              <SelectItem value="portrait">Retrato</SelectItem>
              <SelectItem value="landscape">Paisagem</SelectItem>
            </SelectContent>
          </Select>
        </Row>
      </TabsContent>

      <TabsContent value="gestures" className="pt-2">
        <Row label="Deslizar para virar">
          <Switch checked={s.swipeGesture} onCheckedChange={(v) => s.set({ swipeGesture: v })} />
        </Row>
        <Row label="Botões de volume viram página">
          <Switch checked={s.volumeKeys} onCheckedChange={(v) => s.set({ volumeKeys: v })} />
        </Row>
        {(
          [
            ["tapLeft", "Toque à esquerda"],
            ["tapCenter", "Toque no centro"],
            ["tapRight", "Toque à direita"],
          ] as const
        ).map(([key, label]) => (
          <Row key={key} label={label}>
            <Select value={s[key]} onValueChange={(v) => s.set({ [key]: v as TapAction })}>
              <SelectTrigger className="w-44">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {TAP_ACTIONS.map((a) => (
                  <SelectItem key={a.value} value={a.value}>
                    {a.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </Row>
        ))}
      </TabsContent>
    </Tabs>
  );
}
