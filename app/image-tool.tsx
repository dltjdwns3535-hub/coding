"use client";

import { ChangeEvent, DragEvent, useEffect, useRef, useState } from "react";
import { MAX_DIMENSION, MAX_FILE_BYTES, MAX_PIXELS, OutputFormat, fitDimensions, formatBytes, isSafePixelCount, outputName, targetBytes, validateDimension, validateTargetKb } from "../lib/image-utils";

type Source = { file: File; url: string; image: HTMLImageElement; width: number; height: number };
type Result = { blob: Blob; url: string; width: number; height: number; type: OutputFormat; targetMet: boolean | null };
type Status = "idle" | "processing" | "success" | "unmet" | "error";
const ACCEPTED = ["image/jpeg", "image/png", "image/webp"];
const TYPE_LABEL: Record<OutputFormat, string> = { "image/jpeg": "JPEG", "image/png": "PNG", "image/webp": "WebP" };

function canvasBlob(canvas: HTMLCanvasElement, type: OutputFormat, quality?: number): Promise<Blob> {
  return new Promise((resolve, reject) => canvas.toBlob((blob) => blob ? resolve(blob) : reject(new Error("이미지 파일을 만들지 못했습니다.")), type, quality));
}

export default function ImageTool() {
  const [source, setSource] = useState<Source | null>(null);
  const [result, setResult] = useState<Result | null>(null);
  const [width, setWidth] = useState(""); const [height, setHeight] = useState("");
  const [keepRatio, setKeepRatio] = useState(true); const [format, setFormat] = useState<OutputFormat>("image/jpeg");
  const [background, setBackground] = useState("#ffffff"); const [useTarget, setUseTarget] = useState(false);
  const [target, setTarget] = useState("500"); const [allowResize, setAllowResize] = useState(false);
  const [status, setStatus] = useState<Status>("idle"); const [message, setMessage] = useState("");
  const inputRef = useRef<HTMLInputElement>(null); const operationId = useRef(0);
  const sourceRef = useRef<Source | null>(null); const resultRef = useRef<Result | null>(null);
  const pendingLoad = useRef<{ image: HTMLImageElement; url: string } | null>(null);

  useEffect(() => { sourceRef.current = source; }, [source]);
  useEffect(() => { resultRef.current = result; }, [result]);
  useEffect(() => () => {
    operationId.current++;
    if (pendingLoad.current) { pendingLoad.current.image.src = ""; URL.revokeObjectURL(pendingLoad.current.url); }
    if (sourceRef.current) URL.revokeObjectURL(sourceRef.current.url);
    if (resultRef.current) URL.revokeObjectURL(resultRef.current.url);
  }, []);

  function revokeResult() {
    if (resultRef.current) URL.revokeObjectURL(resultRef.current.url);
    resultRef.current = null;
    setResult(null);
  }

  function invalidateResult() {
    operationId.current++;
    revokeResult();
    setStatus("idle"); setMessage("");
  }

  function cancelPendingLoad() {
    if (!pendingLoad.current) return;
    pendingLoad.current.image.onload = null;
    pendingLoad.current.image.onerror = null;
    pendingLoad.current.image.src = "";
    URL.revokeObjectURL(pendingLoad.current.url);
    pendingLoad.current = null;
  }

  function reset() {
    operationId.current++;
    cancelPendingLoad(); revokeResult();
    if (sourceRef.current) URL.revokeObjectURL(sourceRef.current.url);
    sourceRef.current = null; setSource(null); setWidth(""); setHeight(""); setStatus("idle"); setMessage("");
    if (inputRef.current) inputRef.current.value = "";
  }

  async function loadFile(file?: File) {
    if (!file) return;
    const id = ++operationId.current;
    cancelPendingLoad(); revokeResult(); setStatus("processing"); setMessage("이미지를 확인하고 있습니다…");
    if (!ACCEPTED.includes(file.type)) { setStatus("error"); setMessage("지원하지 않는 파일입니다. JPEG, PNG, WebP 이미지를 선택해 주세요."); return; }
    if (file.size > MAX_FILE_BYTES) { setStatus("error"); setMessage(`파일은 최대 ${formatBytes(MAX_FILE_BYTES)}까지 선택할 수 있습니다.`); return; }
    const url = URL.createObjectURL(file); const image = new Image();
    pendingLoad.current = { image, url };
    try {
      await new Promise<void>((resolve, reject) => { image.onload = () => resolve(); image.onerror = () => reject(new Error()); image.src = url; });
      if (id !== operationId.current) { if (pendingLoad.current?.url === url) pendingLoad.current = null; URL.revokeObjectURL(url); return; }
      if (!isSafePixelCount(image.naturalWidth, image.naturalHeight)) throw new Error("pixels");
      pendingLoad.current = null;
      if (sourceRef.current) URL.revokeObjectURL(sourceRef.current.url);
      const nextSource = { file, url, image, width: image.naturalWidth, height: image.naturalHeight };
      sourceRef.current = nextSource; setSource(nextSource);
      setWidth(String(image.naturalWidth)); setHeight(String(image.naturalHeight)); setStatus("idle"); setMessage("");
    } catch (error) {
      if (pendingLoad.current?.url === url) pendingLoad.current = null;
      URL.revokeObjectURL(url);
      if (id !== operationId.current) return;
      setStatus("error");
      setMessage(error instanceof Error && error.message === "pixels" ? `총 픽셀 수는 최대 ${(MAX_PIXELS / 1_000_000).toFixed(0)}MP까지 처리할 수 있습니다.` : "이미지를 열 수 없습니다. 파일이 손상되었는지 확인해 주세요.");
    }
  }

  function changeWidth(value: string) { invalidateResult(); setWidth(value); const n = validateDimension(value); if (keepRatio && source && n) setHeight(String(Math.max(1, Math.round(n * source.height / source.width)))); }
  function changeHeight(value: string) { invalidateResult(); setHeight(value); const n = validateDimension(value); if (keepRatio && source && n) setWidth(String(Math.max(1, Math.round(n * source.width / source.height)))); }

  async function convert() {
    if (!source || status === "processing") return;
    const wantedWidth = validateDimension(width), wantedHeight = validateDimension(height), targetKb = useTarget ? validateTargetKb(target) : null;
    if (!wantedWidth || !wantedHeight) { setStatus("error"); setMessage(`가로와 세로는 1~${MAX_DIMENSION.toLocaleString("ko-KR")} 사이의 정수로 입력해 주세요.`); return; }
    if (!isSafePixelCount(wantedWidth, wantedHeight)) { setStatus("error"); setMessage(`결과 이미지의 총 픽셀 수는 ${(MAX_PIXELS / 1_000_000).toFixed(0)}MP 이하여야 합니다.`); return; }
    if (useTarget && !targetKb) { setStatus("error"); setMessage("목표 용량은 1~25,000KB 사이로 입력해 주세요."); return; }
    const id = ++operationId.current; revokeResult(); setStatus("processing"); setMessage("브라우저에서 이미지를 변환하고 있습니다…");
    await new Promise<void>(resolve => requestAnimationFrame(() => resolve()));
    try {
      let currentWidth = wantedWidth, currentHeight = wantedHeight, blob: Blob | null = null;
      const limit = targetKb ? targetBytes(targetKb) : null;
      for (let resizeTry = 0; resizeTry < 9; resizeTry++) {
        const canvas = document.createElement("canvas"); canvas.width = currentWidth; canvas.height = currentHeight;
        const context = canvas.getContext("2d", { alpha: format !== "image/jpeg" });
        if (!context) throw new Error("이 브라우저에서 이미지 처리를 시작할 수 없습니다.");
        context.imageSmoothingEnabled = true; context.imageSmoothingQuality = "high";
        if (format === "image/jpeg") { context.fillStyle = background; context.fillRect(0, 0, currentWidth, currentHeight); }
        context.drawImage(source.image, 0, 0, currentWidth, currentHeight);
        if (limit && format !== "image/png") {
          let low = 0.05, high = 0.95, best: Blob | null = null;
          for (let attempt = 0; attempt < 9; attempt++) {
            const quality = (low + high) / 2; const candidate = await canvasBlob(canvas, format, quality);
            if (candidate.type !== format) throw new Error(`${TYPE_LABEL[format]} 출력을 지원하지 않는 브라우저입니다.`);
            if (candidate.size <= limit) { best = candidate; low = quality; } else high = quality;
          }
          blob = best ?? await canvasBlob(canvas, format, 0.05);
        } else blob = await canvasBlob(canvas, format, 0.92);
        if (blob.type !== format) throw new Error(`${TYPE_LABEL[format]} 형식으로 생성되지 않아 저장을 중단했습니다.`);
        if (!limit || blob.size <= limit || !allowResize) break;
        if (resizeTry === 8) break;
        const scale = Math.min(0.9, Math.sqrt(limit / blob.size) * 0.92); const next = fitDimensions(currentWidth, currentHeight, scale);
        if (next.width === currentWidth && next.height === currentHeight) break;
        currentWidth = next.width; currentHeight = next.height;
      }
      if (id !== operationId.current) return;
      if (!blob) throw new Error("결과 파일을 만들지 못했습니다.");
      const met = limit ? blob.size <= limit : null;
      const nextResult = { blob, url: URL.createObjectURL(blob), width: currentWidth, height: currentHeight, type: format, targetMet: met };
      resultRef.current = nextResult; setResult(nextResult);
      setStatus(met === false ? "unmet" : "success");
      setMessage(met === false ? (format === "image/png" ? "목표 미달: PNG는 품질 조절이 적용되지 않습니다. JPEG·WebP를 선택하거나 픽셀 크기를 직접 줄여 보세요." : "목표 미달: 최저 품질과 허용된 범위의 축소로도 목표 용량에 도달하지 못했습니다. 더 작은 픽셀 크기를 설정해 보세요.") : "변환이 완료되었습니다. 결과를 확인하고 저장하세요.");
    } catch (error) { if (id === operationId.current) { setStatus("error"); setMessage(error instanceof Error ? error.message : "변환 중 오류가 발생했습니다. 다시 시도해 주세요."); } }
  }

  function download() {
    if (!result || !source) return;
    try { const link = document.createElement("a"); link.href = result.url; link.download = outputName(source.file.name, result.type); document.body.appendChild(link); link.click(); link.remove(); }
    catch { setStatus("error"); setMessage("다운로드를 시작하지 못했습니다. 잠시 후 다시 눌러 주세요."); }
  }

  const widthNumber = validateDimension(width), heightNumber = validateDimension(height);
  const enlarged = !!source && !!widthNumber && !!heightNumber && (widthNumber > source.width || heightNumber > source.height);
  return <section className="tool" aria-label="이미지 변환 도구">
    <div className="workspace">
      <div className="previewPanel">
        <div className="sectionHead"><span className="stepNo">1</span><div><h2>사진 선택</h2><p>한 번에 이미지 한 장을 처리합니다.</p></div></div>
        {!source ? <div className="dropzone" tabIndex={0} role="button" onClick={() => inputRef.current?.click()} onKeyDown={e => { if (e.key === "Enter" || e.key === " ") inputRef.current?.click(); }} onDragOver={e => e.preventDefault()} onDrop={(e: DragEvent) => { e.preventDefault(); void loadFile(e.dataTransfer.files[0]); }}>
          <div className="uploadIcon" aria-hidden="true">↑</div><strong>사진을 끌어다 놓으세요</strong><span>또는</span><span className="selectButton">파일 선택</span><small>JPEG, PNG, WebP · 최대 25MB · 최대 40MP</small>
        </div> : <div className="sourceCard"><div className="imageFrame"><img src={source.url} alt="선택한 원본 미리보기" /></div><div className="fileInfo"><strong title={source.file.name}>{source.file.name}</strong><span>{formatBytes(source.file.size)} · {source.width.toLocaleString()} × {source.height.toLocaleString()}px</span></div><button className="textButton" type="button" onClick={() => inputRef.current?.click()}>다른 이미지 선택</button></div>}
        <input ref={inputRef} className="visuallyHidden" type="file" accept="image/jpeg,image/png,image/webp" onChange={(e: ChangeEvent<HTMLInputElement>) => void loadFile(e.target.files?.[0])} />
      </div>
      <div className="settingsPanel">
        <div className="sectionHead"><span className="stepNo">2</span><div><h2>변환 조건</h2><p>필요한 결과 규격을 입력하세요.</p></div></div>
        <fieldset disabled={!source || status === "processing"}><legend>픽셀 크기</legend><div className="dimensionRow"><label>가로 <span className="inputSuffix"><input aria-label="가로 픽셀" inputMode="numeric" value={width} onChange={e => changeWidth(e.target.value)} /><i>px</i></span></label><span className="times">×</span><label>세로 <span className="inputSuffix"><input aria-label="세로 픽셀" inputMode="numeric" value={height} onChange={e => changeHeight(e.target.value)} /><i>px</i></span></label></div><label className="check"><input type="checkbox" checked={keepRatio} onChange={e => { invalidateResult(); setKeepRatio(e.target.checked); }} /> 원본 비율 유지</label>{enlarged && <p className="notice">원본보다 크게 만들면 이미지가 흐려질 수 있습니다.</p>}</fieldset>
        <fieldset disabled={!source || status === "processing"}><legend>파일 형식</legend><div className="formatGroup">{(["image/jpeg", "image/png", "image/webp"] as OutputFormat[]).map(type => <label key={type} className={format === type ? "selected" : ""}><input type="radio" name="format" value={type} checked={format === type} onChange={() => { invalidateResult(); setFormat(type); }} />{TYPE_LABEL[type]}</label>)}</div>{format === "image/jpeg" && <label className="colorLabel">투명 영역 배경색 <span><input aria-label="JPEG 배경색" type="color" value={background} onChange={e => { invalidateResult(); setBackground(e.target.value); }} /><code>{background.toUpperCase()}</code></span></label>}</fieldset>
        <fieldset disabled={!source || status === "processing"}><legend>목표 용량 <em>선택</em></legend><label className="switchLine"><input type="checkbox" checked={useTarget} onChange={e => { invalidateResult(); setUseTarget(e.target.checked); }} /> 목표 용량 이하로 줄이기</label>{useTarget && <><div className="presets">{[100, 500, 1000].map(n => <button type="button" className={target === String(n) ? "active" : ""} key={n} onClick={() => { invalidateResult(); setTarget(String(n)); }}>{n === 1000 ? "1MB" : `${n}KB`}</button>)}</div><label className="targetInput">직접 입력 <span className="inputSuffix"><input aria-label="목표 용량 KB" inputMode="decimal" value={target} onChange={e => { invalidateResult(); setTarget(e.target.value); }} /><i>KB</i></span></label><p className="helper">1KB = 1,000바이트로 계산합니다.</p>{format === "image/png" && <p className="notice">PNG에는 품질 조절이 적용되지 않으며 생성된 실제 용량으로 판정합니다.</p>}<label className="check"><input type="checkbox" checked={allowResize} onChange={e => { invalidateResult(); setAllowResize(e.target.checked); }} /> {format === "image/png" ? "필요하면 픽셀을 자동 축소" : "품질 조절로 부족하면 픽셀도 자동 축소"}</label></>}</fieldset>
        <button className="primary" type="button" disabled={!source || status === "processing"} onClick={() => void convert()}>{status === "processing" ? <><span className="spinner" /> 변환 중…</> : "사진 변환하기"}</button>
        {message && <div className={`status ${status}`} role="status"><strong>{status === "success" ? "변환 성공" : status === "unmet" ? "목표 미달" : status === "error" ? "확인 필요" : "처리 중"}</strong><span>{message}</span></div>}
      </div>
    </div>
    {result && source && <div className="results"><div className="sectionHead"><span className="stepNo">3</span><div><h2>변환 결과</h2><p>저장하기 전에 결과를 비교해 보세요.</p></div></div><div className="compare"><figure><figcaption>원본 <span>{formatBytes(source.file.size)}</span></figcaption><div className="imageFrame"><img src={source.url} alt="원본 이미지" /></div><dl><div><dt>크기</dt><dd>{source.width} × {source.height}px</dd></div><div><dt>형식</dt><dd>{source.file.type.replace("image/", "").toUpperCase()}</dd></div></dl></figure><figure className="resultFigure"><figcaption>결과 <span>{result.targetMet === false ? "목표 미달" : "완료"}</span></figcaption><div className="imageFrame checker"><img src={result.url} alt="변환 결과 이미지" /></div><dl><div><dt>용량</dt><dd>{formatBytes(result.blob.size)}</dd></div><div><dt>크기</dt><dd>{result.width} × {result.height}px</dd></div><div><dt>형식</dt><dd>{TYPE_LABEL[result.type]}</dd></div><div><dt>변화</dt><dd className={result.blob.size <= source.file.size ? "saving" : "increase"}>{result.blob.size <= source.file.size ? "−" : "+"}{Math.abs((1 - result.blob.size / source.file.size) * 100).toFixed(1)}%</dd></div></dl></figure></div><div className="resultActions"><button className="primary" type="button" onClick={download}>결과 파일 저장</button><button className="secondary" type="button" onClick={reset}>처음부터 다시</button></div><p className="downloadHelp">다운로드가 시작되지 않으면 ‘결과 파일 저장’을 다시 눌러 주세요.</p></div>}
  </section>;
}
