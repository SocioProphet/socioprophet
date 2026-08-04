// The world registry — every UN member state (+ key observers/territories), used by the data
// catalogue to grade per-country coverage. income tier (H/UM/LM/L) is a coarse proxy for how
// much open data a country tends to expose; the catalogue combines it with each source's real
// geographic scope to produce an HONEST per-country data-quality grade (A–F), including F.
export type Region = 'Americas' | 'Europe' | 'Africa' | 'Asia' | 'Oceania';
export type Income = 'H' | 'UM' | 'LM' | 'L';
export interface Country { iso: string; name: string; region: Region; income: Income }

// iso2 | name | region | income. UN members + Vatican/Palestine/Kosovo/Taiwan.
const RAW = `
US|United States|Americas|H
CA|Canada|Americas|H
MX|Mexico|Americas|UM
BR|Brazil|Americas|UM
AR|Argentina|Americas|UM
CL|Chile|Americas|H
CO|Colombia|Americas|UM
PE|Peru|Americas|UM
VE|Venezuela|Americas|UM
EC|Ecuador|Americas|UM
BO|Bolivia|Americas|LM
PY|Paraguay|Americas|UM
UY|Uruguay|Americas|H
GY|Guyana|Americas|H
SR|Suriname|Americas|UM
GT|Guatemala|Americas|UM
HN|Honduras|Americas|LM
SV|El Salvador|Americas|LM
NI|Nicaragua|Americas|LM
CR|Costa Rica|Americas|UM
PA|Panama|Americas|H
CU|Cuba|Americas|UM
DO|Dominican Republic|Americas|UM
HT|Haiti|Americas|L
JM|Jamaica|Americas|UM
TT|Trinidad and Tobago|Americas|H
BS|Bahamas|Americas|H
BB|Barbados|Americas|H
BZ|Belize|Americas|UM
GB|United Kingdom|Europe|H
FR|France|Europe|H
DE|Germany|Europe|H
IT|Italy|Europe|H
ES|Spain|Europe|H
PT|Portugal|Europe|H
NL|Netherlands|Europe|H
BE|Belgium|Europe|H
LU|Luxembourg|Europe|H
IE|Ireland|Europe|H
CH|Switzerland|Europe|H
AT|Austria|Europe|H
SE|Sweden|Europe|H
NO|Norway|Europe|H
DK|Denmark|Europe|H
FI|Finland|Europe|H
IS|Iceland|Europe|H
PL|Poland|Europe|H
CZ|Czechia|Europe|H
SK|Slovakia|Europe|H
HU|Hungary|Europe|H
RO|Romania|Europe|H
BG|Bulgaria|Europe|UM
GR|Greece|Europe|H
HR|Croatia|Europe|H
SI|Slovenia|Europe|H
RS|Serbia|Europe|UM
BA|Bosnia and Herzegovina|Europe|UM
ME|Montenegro|Europe|UM
MK|North Macedonia|Europe|UM
AL|Albania|Europe|UM
XK|Kosovo|Europe|UM
UA|Ukraine|Europe|LM
BY|Belarus|Europe|UM
MD|Moldova|Europe|UM
LT|Lithuania|Europe|H
LV|Latvia|Europe|H
EE|Estonia|Europe|H
RU|Russia|Europe|UM
VA|Vatican City|Europe|H
MT|Malta|Europe|H
CY|Cyprus|Europe|H
AD|Andorra|Europe|H
MC|Monaco|Europe|H
SM|San Marino|Europe|H
LI|Liechtenstein|Europe|H
CN|China|Asia|UM
JP|Japan|Asia|H
KR|South Korea|Asia|H
KP|North Korea|Asia|L
IN|India|Asia|LM
PK|Pakistan|Asia|LM
BD|Bangladesh|Asia|LM
LK|Sri Lanka|Asia|LM
NP|Nepal|Asia|LM
BT|Bhutan|Asia|LM
MV|Maldives|Asia|UM
AF|Afghanistan|Asia|L
ID|Indonesia|Asia|UM
MY|Malaysia|Asia|UM
SG|Singapore|Asia|H
TH|Thailand|Asia|UM
VN|Vietnam|Asia|LM
PH|Philippines|Asia|LM
MM|Myanmar|Asia|LM
KH|Cambodia|Asia|LM
LA|Laos|Asia|LM
BN|Brunei|Asia|H
TL|Timor-Leste|Asia|LM
TW|Taiwan|Asia|H
MN|Mongolia|Asia|LM
KZ|Kazakhstan|Asia|UM
UZ|Uzbekistan|Asia|LM
TM|Turkmenistan|Asia|UM
KG|Kyrgyzstan|Asia|LM
TJ|Tajikistan|Asia|LM
SA|Saudi Arabia|Asia|H
AE|United Arab Emirates|Asia|H
QA|Qatar|Asia|H
KW|Kuwait|Asia|H
BH|Bahrain|Asia|H
OM|Oman|Asia|H
YE|Yemen|Asia|L
IQ|Iraq|Asia|UM
IR|Iran|Asia|LM
SY|Syria|Asia|L
JO|Jordan|Asia|LM
LB|Lebanon|Asia|LM
IL|Israel|Asia|H
PS|Palestine|Asia|LM
TR|Turkey|Asia|UM
GE|Georgia|Asia|UM
AM|Armenia|Asia|UM
AZ|Azerbaijan|Asia|UM
EG|Egypt|Africa|LM
LY|Libya|Africa|UM
TN|Tunisia|Africa|LM
DZ|Algeria|Africa|LM
MA|Morocco|Africa|LM
SD|Sudan|Africa|L
SS|South Sudan|Africa|L
ET|Ethiopia|Africa|L
ER|Eritrea|Africa|L
DJ|Djibouti|Africa|LM
SO|Somalia|Africa|L
KE|Kenya|Africa|LM
UG|Uganda|Africa|L
TZ|Tanzania|Africa|LM
RW|Rwanda|Africa|L
BI|Burundi|Africa|L
NG|Nigeria|Africa|LM
GH|Ghana|Africa|LM
CI|Cote d'Ivoire|Africa|LM
SN|Senegal|Africa|LM
ML|Mali|Africa|L
BF|Burkina Faso|Africa|L
NE|Niger|Africa|L
TD|Chad|Africa|L
MR|Mauritania|Africa|LM
GN|Guinea|Africa|L
SL|Sierra Leone|Africa|L
LR|Liberia|Africa|L
TG|Togo|Africa|L
BJ|Benin|Africa|LM
GM|Gambia|Africa|L
GW|Guinea-Bissau|Africa|L
CV|Cabo Verde|Africa|LM
CM|Cameroon|Africa|LM
CF|Central African Republic|Africa|L
CG|Congo|Africa|LM
CD|DR Congo|Africa|L
GA|Gabon|Africa|UM
GQ|Equatorial Guinea|Africa|UM
ST|Sao Tome and Principe|Africa|LM
AO|Angola|Africa|LM
ZM|Zambia|Africa|LM
ZW|Zimbabwe|Africa|LM
MW|Malawi|Africa|L
MZ|Mozambique|Africa|L
BW|Botswana|Africa|UM
NA|Namibia|Africa|UM
ZA|South Africa|Africa|UM
LS|Lesotho|Africa|LM
SZ|Eswatini|Africa|LM
MG|Madagascar|Africa|L
MU|Mauritius|Africa|UM
SC|Seychelles|Africa|H
KM|Comoros|Africa|LM
AU|Australia|Oceania|H
NZ|New Zealand|Oceania|H
PG|Papua New Guinea|Oceania|LM
FJ|Fiji|Oceania|UM
SB|Solomon Islands|Oceania|LM
VU|Vanuatu|Oceania|LM
WS|Samoa|Oceania|LM
TO|Tonga|Oceania|UM
KI|Kiribati|Oceania|LM
FM|Micronesia|Oceania|LM
MH|Marshall Islands|Oceania|UM
PW|Palau|Oceania|H
NR|Nauru|Oceania|H
TV|Tuvalu|Oceania|UM
`;

export const COUNTRIES: Country[] = RAW.trim().split('\n').map((line) => {
  const [iso, name, region, income] = line.split('|');
  return { iso, name, region: region as Region, income: income as Income };
});

export const REGIONS: Region[] = ['Americas', 'Europe', 'Africa', 'Asia', 'Oceania'];
