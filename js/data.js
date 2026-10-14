/* Clientes com tour 360° publicado no Google Maps.
   lat/lon = ponto exato do Google Maps; heading = direção inicial do tour (graus);
   label = posição da etiqueta no mapa da abertura (px em relação ao ponto). */
export const CASES = [
  {
    key: 'lagom', name: 'Lagom Perequê', brand: 'GT Home & ABC', place: 'Porto Belo · Itapema', segment: 'Empreendimento',
    lat: -27.1488594, lon: -48.581779, heading: 43, label: [74, -22], short: 'Lagom Perequê',
    maps: 'https://www.google.com/maps/place/Lagom+Perequ%C3%AA+-+Porto+Belo/@-27.1498755,-48.5828492,3a,75y,4.6h,89.76t/data=!3m7!1e1!3m5!1sCIABIhAtq8hDXiV7Y5l3fAGgkEXU!2e10!7i11968!8i5984!4m9!3m8!1s0x94d8afac199b2585:0xbb5825314aa6d305!8m2!3d-27.1488594!4d-48.581779!10e5!16s%2Fg%2F11vj56j3mz',
  },
  {
    key: 'majestic', name: 'Majestic Palace Hotel', place: 'Florianópolis', segment: 'Hotel',
    lat: -27.5833216, lon: -48.5444964, heading: 232, label: [40, -24], short: 'Majestic Palace',
    maps: 'https://www.google.com/maps/place/Majestic+Palace+Hotel/@-27.5832155,-48.5444415,3a,75y,155.5h,89.46t/data=!3m7!1e1!3m5!1sCIABIhBSHCPmwdMnpmnRPJyOaoOh!2e10!7i8400!8i4200!4m12!3m11!1s0x952738114f2ff87d:0xb271411bf8880135!5m2!4m1!1i2!8m2!3d-27.5833216!4d-48.5444964!10e5!16s%2Fg%2F1w2y_m6c',
  },
  {
    key: 'concept', name: 'Academia Concept Club', place: 'Itapema', segment: 'Fitness premium',
    lat: -27.1429208, lon: -48.5841015, heading: 252, label: [-76, -76], short: 'Concept Club',
    maps: 'https://www.google.com/maps/place/Academia+Concept+Club/@-27.142847,-48.5840579,3a,75y,69.08h,78.85t/data=!3m7!1e1!3m5!1sCIABIhCMU8FDmvfKUOAuT5kHbs10!2e10!7i11968!8i5984!4m9!3m8!1s0x94d8afa1a6d504bd:0xdd79f675eeb97eae!8m2!3d-27.1429208!4d-48.5841015!10e5!16s%2Fg%2F11zbmqzzhp',
  },
  {
    key: 'pier', name: 'Píer Turístico Hard Rock Cafe', place: 'Itapema', segment: 'Gastronomia e turismo',
    lat: -27.1441229, lon: -48.5856612, heading: 180, label: [-74, -22], short: 'Hard Rock Pier',
    maps: 'https://www.google.com/maps/place/P%C3%ADer+Oporto/@-27.1436484,-48.5852336,3a,75y,19.42h,121.37t/data=!3m8!1e1!3m6!1sCIABIhBsh_DLskrtRLeBpPYv9NKD!2e10!3e11!7i5888!8i2944!4m9!3m8!1s0x94d8af001425b9cb:0x264039fa5f072267!8m2!3d-27.1441229!4d-48.5856612!10e5!16s%2Fg%2F11yr2c7jvq',
  },
  {
    key: 'bluesea', name: 'Hotel Blue Sea', place: 'Itapema', segment: 'Hotel',
    lat: -27.0663841, lon: -48.5949144, heading: 173, label: [110, -42], short: 'Hotel Blue Sea',
    maps: 'https://www.google.com/maps/place/Blue+Sea+Hotel+-+Itapema+SC/@-27.0663257,-48.5946123,3a,90y,218.81h,108.72t/data=!3m7!1e1!3m5!1sCIABIhAQt0QcXGXzH-PAmGZeZ7EO!2e10!7i8400!8i4200!4m12!3m11!1s0x94d8b0e09d9b966b:0x360d8c01a517ec30!5m2!4m1!1i2!8m2!3d-27.0663841!4d-48.5949144!10e5!16s%2Fg%2F11f5dc3cjw',
  },
  {
    key: 'caixadaco', name: 'Pousada Caixa D’Aço Exclusive', place: 'Praia do Caixa D’Aço · Porto Belo', segment: 'Hospedagem',
    lat: -27.1289263, lon: -48.5252722, heading: 151, label: [44, -50], short: 'Caixa D’Aço',
    maps: "https://www.google.com/maps/place/Caixa+D'a%C3%A7o+Exclusive+Hotel/@-27.1289263,-48.5252722,3a,90y,217.28h,87.36t/data=!3m8!1e1!3m6!1sCIABIhD8GK-9e_Ry97e7zItvdMxT!2e10!3e11!7i6080!8i3040!4m12!3m11!1s0x94d8a504e98d9a23:0xf3c4dadb2dd145f6!5m2!4m1!1i2!8m2!3d-27.1289263!4d-48.5252722!10e5!16s%2Fg%2F11fylwyrqn",
  },
  {
    key: 'portobelohall', name: 'Porto Belo Hall', place: 'Porto Belo', segment: 'Eventos', logo: 'logo-portobelohall',
    lat: -27.1572469, lon: -48.5563231, heading: 187, label: [48, 24], short: 'Porto Belo Hall',
    maps: 'https://www.google.com/maps/place/Porto+Belo+Hall/@-27.1583305,-48.5565916,3a,90y,9.37h,97.19t/data=!3m8!1e1!3m6!1sCIABIhCf24IUJGg0krRL0stLiQQV!2e10!3e11!7i8400!8i4200!4m9!3m8!1s0x27c219b51e128b5b:0xe8f4e0bd0f6aee19!8m2!3d-27.1572469!4d-48.5563231!10e5!16s%2Fg%2F11x8r16rg3',
  },
  {
    key: 'allwert', name: 'Showroom All Wert', place: 'Porto Belo', segment: 'Construtora', logo: 'logo-allwert',
    lat: -27.1675906, lon: -48.6260365, heading: 205, label: [-36, 10], short: 'All Wert',
    maps: 'https://www.google.com/maps/place/Showroom+All+Wert/@-27.1672646,-48.6258294,3a,75y,131.41h,88.24t/data=!3m7!1e1!3m5!1sCIABIhBhL3l4C5gM1yKHdDGXiI2o!2e10!7i6530!8i3265!4m9!3m8!1s0x94d8af0048108669:0xf58829259515d3d1!8m2!3d-27.1675906!4d-48.6260365!10e5!16s%2Fg%2F11x25frrlr',
  },
  {
    key: 'castello', name: 'Castello Dal Pozzo', place: 'Oleggio Castello · Itália', segment: 'Resort e restaurante', logo: 'logo-castello',
    lat: 45.7518584, lon: 8.5312244, heading: 196, label: [20, -20], abroad: true,
    maps: 'https://www.google.com/maps/place/Castello+Dal+Pozzo/@45.7521437,8.5313718,3a,75y,149.08h,89.24t/data=!3m8!1e1!3m6!1sCIABIhBZ-GlfQrNEo_5YQE0Dz7_m!2e10!3e11!7i6530!8i3265!4m12!3m11!1s0x478671f64a13d927:0x9da3b7c69ee36550!5m2!4m1!1i2!8m2!3d45.7518584!4d8.5312244!10e5!16s%2Fg%2F11hdb9dw2_',
  },
];
export const CASE = Object.fromEntries(CASES.map((c) => [c.key, c]));

export const mobile = matchMedia('(max-width: 760px), (pointer: coarse)').matches;
export const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;
export const panoUrl = (k) => `assets/pano/${k}-${mobile ? '2k' : '4k'}.webp`;
