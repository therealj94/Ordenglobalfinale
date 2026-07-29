/**
 * Turns a failed request into something the person reading it can act on.
 *
 * The default of falling back to a single generic string hid the two failures
 * that actually strand people — the request never reaching the server, and the
 * server timing out on a cold start — behind the same wording as a genuine
 * rejection, leaving no way to tell "try again in a minute" from "this will
 * never work".
 */
export function describeError(err: any, fallback: string): string {
  const serverMessage = err?.response?.data?.error;
  if (serverMessage) return serverMessage;

  if (err?.code === 'ECONNABORTED') {
    return 'El servicio tardó demasiado en responder. Puede estar despertando — vuelve a intentar en un minuto.';
  }

  // No response at all: the request never got there. Network down, or the
  // browser blocked it (a CORS origin that doesn't match looks exactly like
  // this from here — the response arrives but scripts can't read it).
  if (!err?.response) {
    return 'No pudimos conectar con GENESIS ID. Revisa tu conexión e intenta de nuevo.';
  }

  if (err.response.status >= 500) {
    return 'GENESIS ID tuvo un problema interno. Intenta de nuevo en un momento.';
  }

  return fallback;
}
