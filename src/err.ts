// this one is fine
export function SHITBED(
  errorCode: string,
  dumpData: any = {}
): void {
  throw Error(
    errorCode +
      '\nDATA: ' +
      JSON.stringify(dumpData, undefined, 2)
  );
}
