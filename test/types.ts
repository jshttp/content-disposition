import { expectTypeOf } from "expect-type";
import contentDisposition from "..";

const noParams = contentDisposition();
expectTypeOf(noParams).toBeString();
const withFilenameNoOptions = contentDisposition("EURO rates.txt");
expectTypeOf(withFilenameNoOptions).toBeString();
const withFilenameAndOptions = contentDisposition("€ rates.txt", { type: "attachment", fallback: "EURO rates.txt" });
expectTypeOf(withFilenameAndOptions).toBeString();
const noFilename = contentDisposition(undefined, { type: "attachment", fallback: true });
expectTypeOf(noFilename).toBeString();

const { parse } = contentDisposition;

const res = parse("attachment; filename=\"EURO rates.txt\"");

expectTypeOf(res.type).toBeString();
expectTypeOf(res.parameters).toEqualTypeOf<{ [key: string]: string }>();

if ("filename" in res.parameters) {
    expectTypeOf(res.parameters["filename"]).toBeString();
}