export function readWasmErrorText(pointer, readByte) {
  const bytes = [];
  for (let offset = 0; offset < 4096; offset++) {
    const value = readByte(pointer + offset);
    if (!value) break;
    bytes.push(value & 255);
  }
  return new TextDecoder().decode(new Uint8Array(bytes)) || 'WASM operation failed';
}
