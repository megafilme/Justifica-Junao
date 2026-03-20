import { useState, useCallback } from "react";
import { useDropzone } from "react-dropzone";
import * as XLSX from "xlsx";
import TruckScene from "./components/TruckScene";
import JustificativaCard from "./components/JustificativaCard";
import { gerarJustificativas } from "./utils/gerarJustificativas";

export default function App() {
  const [pastedText, setPastedText] = useState("");
  const [justificativas, setJustificativas] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [fileName, setFileName] = useState("");
  const [activeTab, setActiveTab] = useState<"upload" | "colar">("upload");
  const [error, setError] = useState("");
  const [copyAllDone, setCopyAllDone] = useState(false);

  const processFile = useCallback((file: File) => {
    setError("");
    setFileName(file.name);
    setLoading(true);
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const data = new Uint8Array(e.target?.result as ArrayBuffer);
        const workbook = XLSX.read(data, { type: "array" });
        const sheet = workbook.Sheets[workbook.SheetNames[0]];
        const rows: string[][] = XLSX.utils.sheet_to_json(sheet, {
          header: 1,
          defval: "",
        }) as string[][];

        const lines = rows
          .map((row) =>
            row
              .map((cell) => String(cell ?? "").trim())
              .filter(Boolean)
              .join(" | ")
          )
          .filter((line) => line.trim().length > 0);

        const resultado = gerarJustificativas(lines);
        setJustificativas(resultado);
      } catch {
        setError("Erro ao ler o arquivo. Tente novamente com .xlsx ou .xls.");
      } finally {
        setLoading(false);
      }
    };
    reader.readAsArrayBuffer(file);
  }, []);

  const onDrop = useCallback(
    (accepted: File[]) => {
      if (accepted.length > 0) processFile(accepted[0]);
    },
    [processFile]
  );

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet": [".xlsx"],
      "application/vnd.ms-excel": [".xls"],
      "text/csv": [".csv"],
    },
    multiple: false,
  });

  const handlePasteGenerate = () => {
    setError("");
    if (!pastedText.trim()) {
      setError("Cole algum conteúdo antes de gerar.");
      return;
    }
    setLoading(true);
    setTimeout(() => {
      const lines = pastedText
        .split(/\n/)
        .map((l) => l.trim())
        .filter((l) => l.length > 2);
      const resultado = gerarJustificativas(lines);
      setJustificativas(resultado);
      setLoading(false);
    }, 500);
  };

  const handleCopy = (text: string) => {
    navigator.clipboard.writeText(text);
  };

  const handleCopyAll = () => {
    const all = justificativas
      .map((j, i) => `Justificativa ${i + 1}:\n${j}`)
      .join("\n\n---\n\n");
    navigator.clipboard.writeText(all);
    setCopyAllDone(true);
    setTimeout(() => setCopyAllDone(false), 2000);
  };

  const handleClear = () => {
    setJustificativas([]);
    setPastedText("");
    setFileName("");
    setError("");
  };

  return (
    <div className="min-h-screen bg-[#080b12] relative overflow-x-hidden">
      <TruckScene />

      {/* Grade de pontos discreta */}
      <div
        className="fixed inset-0 z-0 pointer-events-none"
        style={{
          backgroundImage: "radial-gradient(circle, rgba(255,255,255,0.025) 1px, transparent 1px)",
          backgroundSize: "28px 28px",
        }}
      />

      {/* Gradiente superior */}
      <div className="fixed top-0 left-0 w-full h-48 bg-gradient-to-b from-[#0a0f1e]/60 to-transparent z-0 pointer-events-none" />

      {/* Conteúdo principal */}
      <div className="relative z-20 max-w-3xl mx-auto px-4 pt-10 pb-24">

        {/* Cabeçalho */}
        <div className="mb-10">
          <div className="flex items-center gap-3 mb-1">
            <div className="w-1 h-10 bg-[#2a4aaa] rounded-full" />
            <div>
              <p className="text-[10px] text-[#4a5a8a] uppercase tracking-[0.2em] font-semibold">
                Electrolux — Frota & Logística
              </p>
              <h1 className="text-2xl font-bold text-[#d0d8f0] tracking-tight leading-tight">
                Marcos Justificativa
              </h1>
              <p className="text-[#5a6a9a] text-xs mt-0.5 font-medium tracking-wide">
                Gerador de Justificativas Operacionais
              </p>
            </div>
          </div>
          <p className="text-[#3a4a6a] text-xs mt-2 ml-4 pl-3">
            Carregue uma planilha ou cole os dados diretamente para gerar justificativas operacionais.
          </p>
        </div>

        {/* Card principal */}
        <div className="bg-[#0c1020]/90 backdrop-blur border border-white/6 rounded-xl shadow-2xl mb-6 overflow-hidden">
          {/* Tabs */}
          <div className="flex border-b border-white/6">
            <button
              onClick={() => setActiveTab("upload")}
              className={`flex-1 py-3 px-5 text-xs font-semibold uppercase tracking-widest transition-all duration-200 ${
                activeTab === "upload"
                  ? "text-[#8ba2d4] border-b-2 border-[#2a4aaa] bg-[#0e1428]"
                  : "text-[#3a4a6a] hover:text-[#6b82c4] border-b-2 border-transparent"
              }`}
            >
              Upload de Planilha
            </button>
            <button
              onClick={() => setActiveTab("colar")}
              className={`flex-1 py-3 px-5 text-xs font-semibold uppercase tracking-widest transition-all duration-200 ${
                activeTab === "colar"
                  ? "text-[#8ba2d4] border-b-2 border-[#2a4aaa] bg-[#0e1428]"
                  : "text-[#3a4a6a] hover:text-[#6b82c4] border-b-2 border-transparent"
              }`}
            >
              Colar Dados
            </button>
          </div>

          <div className="p-6">
            {/* Upload */}
            {activeTab === "upload" && (
              <div>
                <div
                  {...getRootProps()}
                  className={`border border-dashed rounded-lg p-10 text-center cursor-pointer transition-all duration-200 ${
                    isDragActive
                      ? "border-[#2a4aaa] bg-[#0e1428]"
                      : "border-white/8 hover:border-white/16 hover:bg-white/2"
                  }`}
                >
                  <input {...getInputProps()} />
                  <div className="flex flex-col items-center gap-3">
                    {/* Ícone planilha */}
                    <svg width="36" height="36" viewBox="0 0 36 36" fill="none" xmlns="http://www.w3.org/2000/svg" className="opacity-40">
                      <rect x="4" y="2" width="28" height="32" rx="3" stroke="#6b82c4" strokeWidth="1.5" />
                      <line x1="4" y1="12" x2="32" y2="12" stroke="#6b82c4" strokeWidth="1" />
                      <line x1="4" y1="20" x2="32" y2="20" stroke="#6b82c4" strokeWidth="1" />
                      <line x1="4" y1="28" x2="32" y2="28" stroke="#6b82c4" strokeWidth="1" />
                      <line x1="14" y1="12" x2="14" y2="34" stroke="#6b82c4" strokeWidth="1" />
                      <line x1="24" y1="12" x2="24" y2="34" stroke="#6b82c4" strokeWidth="1" />
                    </svg>
                    <p className="text-[#8ba2d4] text-sm font-medium">
                      {isDragActive ? "Solte o arquivo aqui" : "Arraste a planilha ou clique para selecionar"}
                    </p>
                    <p className="text-[#3a4a6a] text-xs">
                      Formatos aceitos: .xlsx · .xls · .csv
                    </p>
                    {fileName && (
                      <div className="mt-2 flex items-center gap-2 bg-[#0a1a10] border border-[#1a3a20] rounded px-4 py-2">
                        <div className="w-1.5 h-1.5 rounded-full bg-[#2a8a50]" />
                        <span className="text-[#4a9a60] text-xs font-medium">{fileName}</span>
                      </div>
                    )}
                  </div>
                </div>
                <p className="text-[#2a3a5a] text-[10px] text-center mt-3">
                  Processamento local — nenhum dado é enviado a servidores externos.
                </p>
              </div>
            )}

            {/* Colar */}
            {activeTab === "colar" && (
              <div>
                <label className="block text-[#4a5a8a] text-[10px] uppercase tracking-widest font-semibold mb-2">
                  Conteúdo copiado do Excel
                </label>
                <textarea
                  value={pastedText}
                  onChange={(e) => setPastedText(e.target.value)}
                  placeholder={"Cole aqui as linhas da planilha (Ctrl+C nas células → Ctrl+V aqui)...\nEx: Coleta: Av. Senador Salgado Filho | Entrega: Rua Dias Velho, 74 - SP | ST: 24173"}
                  className="w-full h-44 bg-[#080b12] border border-white/8 rounded-lg p-4 text-[#c8cfe8] placeholder-[#2a3a5a] text-sm resize-none focus:outline-none focus:border-white/16 transition-all font-light"
                />
                <button
                  onClick={handlePasteGenerate}
                  disabled={loading}
                  className="mt-3 w-full bg-[#1a2a5a] hover:bg-[#1e3070] disabled:opacity-40 disabled:cursor-not-allowed text-[#8ba2d4] text-sm font-semibold py-2.5 rounded-lg transition-all duration-200 border border-[#2a3a70] tracking-wide"
                >
                  {loading ? "Processando..." : "Gerar Justificativas"}
                </button>
              </div>
            )}

            {/* Erro */}
            {error && (
              <div className="mt-4 bg-[#1a0a0a] border border-[#3a1a1a] rounded-lg px-4 py-3 text-[#b05050] text-xs">
                {error}
              </div>
            )}

            {/* Loading */}
            {loading && (
              <div className="mt-6 flex flex-col items-center gap-3 py-2">
                <div className="flex gap-1.5">
                  {[0, 1, 2, 3].map((i) => (
                    <div
                      key={i}
                      className="w-1.5 h-1.5 bg-[#3a5aa0] rounded-full animate-bounce"
                      style={{ animationDelay: `${i * 0.15}s` }}
                    />
                  ))}
                </div>
                <p className="text-[#3a4a6a] text-xs">Gerando justificativas...</p>
              </div>
            )}
          </div>
        </div>

        {/* Resultados */}
        {justificativas.length > 0 && !loading && (
          <div>
            {/* Cabeçalho resultados */}
            <div className="flex items-center justify-between mb-4 flex-wrap gap-3">
              <div className="flex items-center gap-2">
                <div className="w-1 h-5 bg-[#2a4aaa] rounded-full" />
                <span className="text-[#8ba2d4] text-sm font-semibold">
                  {justificativas.length} justificativa{justificativas.length !== 1 ? "s" : ""} gerada{justificativas.length !== 1 ? "s" : ""}
                </span>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={handleCopyAll}
                  className={`text-xs font-medium px-4 py-2 rounded border transition-all duration-200 ${
                    copyAllDone
                      ? "bg-[#0d2a1a] border-[#1a5a30] text-[#4caf80]"
                      : "bg-[#0c1428] border-[#1e2e50] text-[#6b82c4] hover:border-[#2a4080] hover:text-[#8ba2d4]"
                  }`}
                >
                  {copyAllDone ? "Copiado!" : "Copiar todas"}
                </button>
                <button
                  onClick={handleClear}
                  className="text-xs font-medium px-4 py-2 rounded border border-[#2a1a1a] text-[#5a3030] hover:text-[#8a4040] hover:border-[#3a1a1a] transition-all duration-200 bg-[#0c0808]"
                >
                  Limpar
                </button>
              </div>
            </div>

            <div className="flex flex-col gap-3">
              {justificativas.map((j, i) => (
                <JustificativaCard
                  key={i}
                  index={i + 1}
                  text={j}
                  onCopy={() => handleCopy(j)}
                />
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
