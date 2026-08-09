/**
 * Kritik kayıt / il-ilçe doğrulama duman testi
 * Çalıştır: npx tsx scripts/smoke-register.ts
 */
import { normalizeTurkishPhone } from "../src/lib/phone";
import {
  getCityByCode,
  getDistrictsForCity,
  isValidCityDistrict,
} from "../src/data/turkey-locations";
import { registerSchema } from "../src/lib/validation/register-schema";

function assert(cond: unknown, msg: string) {
  if (!cond) throw new Error(msg);
}

assert(normalizeTurkishPhone("0532 111 22 33") === "+905321112233", "phone 05xx");
assert(normalizeTurkishPhone("+905321112233") === "+905321112233", "phone +90");
assert(normalizeTurkishPhone("02121112233") === null, "reject landline");
assert(getCityByCode("34")?.name === "İstanbul", "istanbul");
const kadikoy = getDistrictsForCity("34").find((d) => d.name === "Kadıköy");
assert(kadikoy, "kadikoy exists");
assert(isValidCityDistrict("34", kadikoy!.code), "istanbul-kadikoy ok");
assert(!isValidCityDistrict("06", kadikoy!.code), "ankara-kadikoy reject");

const districtCode = getDistrictsForCity("34")[0].code;
const parsed = registerSchema.parse({
  firstName: "Ali",
  lastName: "Veli",
  gender: "MALE",
  phone: "05321112233",
  email: "Ali@Example.com",
  companyName: "",
  country: "TR",
  cityCode: "34",
  districtCode,
  password: "password1",
  passwordConfirm: "password1",
  acceptMembership: true,
  acceptKvkk: true,
  acceptCommercial: false,
});
assert(parsed.companyName === "Ali Veli", "fallback company name");
assert(parsed.email === "ali@example.com", "email normalize");

let threw = false;
try {
  registerSchema.parse({
    firstName: "Ali",
    lastName: "Veli",
    gender: "MALE",
    phone: "05321112233",
    email: "a@b.com",
    country: "TR",
    cityCode: "34",
    districtCode,
    password: "password1",
    passwordConfirm: "password1",
    acceptMembership: false,
    acceptKvkk: true,
  });
} catch {
  threw = true;
}
assert(threw, "membership required");

console.log("smoke-register: OK");
