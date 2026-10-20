/* Clientes com tour 360° publicado no Google Maps.
   lat/lon = ponto exato do Google Maps; heading = direção inicial do tour (graus);
   label = posição da etiqueta no mapa da abertura (px em relação ao ponto). */
export const CASES = [
  {
    key: 'lagom', site: 'https://www.lagompereque.com.br/', name: 'Lagom Perequê', brand: 'GT Home & ABC', place: 'Porto Belo · Itapema', segment: 'Empreendimento',
    lat: -27.1488594, lon: -48.581779, heading: 43, label: [74, -22], short: 'Lagom Perequê',
    maps: "https://www.google.com/maps/place/Lagom+Perequ%C3%AA+-+Porto+Belo/@-27.1498578,-48.5828314,3a,75y,247.7h,86.43t/data=!3m8!1e1!3m6!1sCIABIhAf8rcTcrk_PHsf6lMLYyU4!2e10!3e11!6shttps:%2F%2Flh3.googleusercontent.com%2Fgpms-cs-s%2FAM4Q-U93oSVCz5pEmMJiQ3MyF6LbBx0lbYEkMdxLRHMEpV1cXNP--IjtwFTwhdFfYjeQWDU56Q7ny2n9TnM4tClPxFbMyFH_MEkYUswO6VSvgLvSIw0UzgCgAJm4vdgrrpKk-GNAikG4woG2t-c%3Dw900-h600-k-no-pi3.5744692448641047-ya138.7014954689466-ro0-fo100!7i11968!8i5984!4m13!1m2!2m1!1slagom!3m9!1s0x94d8afac199b2585:0xbb5825314aa6d305!8m2!3d-27.1488594!4d-48.581779!10e5!14m1!1BCgIgARICCAI!15sCgVsYWdvbZIBEmFwYXJ0bWVudF9idWlsZGluZ-ABAA!16s%2Fg%2F11vj56j3mz?entry=ttu&g_ep=EgoyMDI2MTAxNC4wIKXMDSoASAFQAw%3D%3D",
  },
  {
    key: 'majestic', site: 'https://www.majesticpalace.com.br/', name: 'Majestic Palace Hotel', place: 'Florianópolis', segment: 'Hotel',
    lat: -27.5833216, lon: -48.5444964, heading: 232, label: [40, -24], short: 'Majestic Palace',
    maps: "https://www.google.com/maps/place/Majestic+Palace+Hotel/@-27.5832155,-48.5444415,3a,75y,187.37h,86.08t/data=!3m7!1e1!3m5!1sCIABIhBSHCPmwdMnpmnRPJyOaoOh!2e10!6shttps:%2F%2Flh3.googleusercontent.com%2Fgpms-cs-s%2FAM4Q-U9ilvZoG_3XbwVWH5cRGZHbAjHW9Ykipq7FWTp4hNLgQIUtPNruoywZK_holu9yxfxQE0SvRwKixKY7LiDO61PhzoJdDJTU3FxVmK0iHThk2hVKZdFGlaXWTWZ8L5RWWqOGy5JQEsJYFZA%3Dw900-h600-k-no-pi3.9234588809457875-ya168.36645410999424-ro0-fo100!7i8400!8i4200!4m16!1m2!2m1!1smajestic!3m12!1s0x952738114f2ff87d:0xb271411bf8880135!5m2!4m1!1i2!8m2!3d-27.5833216!4d-48.5444964!10e5!14m1!1BCgIgARICCAI!15sCghtYWplc3RpY1oKIghtYWplc3RpY5IBBWhvdGVsmgEkQ2hkRFNVaE5NRzluUzBWSlEwRm5UVU52YlUxWU9YSm5SUkFC4AEA-gEECFkQSA!16s%2Fg%2F1w2y_m6c?entry=ttu&g_ep=EgoyMDI2MTAxNC4wIKXMDSoASAFQAw%3D%3D",
  },
  {
    key: 'concept', site: 'https://academiaconceptclub.com.br/', name: 'Academia Concept Club', place: 'Itapema', segment: 'Fitness premium',
    lat: -27.1429208, lon: -48.5841015, heading: 252, label: [-76, -76], short: 'Concept Club',
    maps: "https://www.google.com/maps/place/Academia+Concept+Club/@-27.1428645,-48.5840006,3a,75y,340h,90t/data=!3m8!1e1!3m6!1sCIABIhBUNiwcvI5IfLUd3sI1jJCP!2e10!3e11!6shttps:%2F%2Flh3.googleusercontent.com%2Fgpms-cs-s%2FAM4Q-U9Ini9D6LxYStjJULHC-oq6wr5oYUWeO870D76x2r-_rKafn9Becx-6wBzzGh_lAnQtazevOgB6lYyuH0oAq5pgyLvpDkWb2jDnnei1vT-XI3rE7rwarjGBmd8naNu0T_yp_qxfSOT0w0M%3Dw900-h600-k-no-pi0-ya350-ro0-fo100!7i11968!8i5984!4m13!1m2!2m1!1sconcept+cluib!3m9!1s0x94d8afa1a6d504bd:0xdd79f675eeb97eae!8m2!3d-27.1429208!4d-48.5841015!10e5!14m1!1BCgIgARICCAI!15sCgxjb25jZXB0IGNsdWIiA4gBAVoOIgxjb25jZXB0IGNsdWKSAQNneW2aAURDaTlEUVVsUlFVTnZaRU5vZEhsalJqbHZUMnQwYkZSV2NESlhiR2gxVVZWc2VtVkRNVkJPUlhoR1UxVk9lVnBJWXhBQuABAPoBBAgAEDw!16s%2Fg%2F11zbmqzzhp?entry=ttu&g_ep=EgoyMDI2MTAxNC4wIKXMDSoASAFQAw%3D%3D",
  },
  {
    key: 'pier', site: 'https://www.instagram.com/pier_oporto/', name: 'Píer Turístico Hard Rock Cafe', place: 'Itapema', segment: 'Gastronomia e turismo',
    lat: -27.1441229, lon: -48.5856612, heading: 180, label: [-74, -22], short: 'Hard Rock Pier',
    maps: "https://www.google.com/maps/place/P%C3%ADer+Oporto/@-27.1436484,-48.5852336,3a,75y,17.56h,123.38t/data=!3m8!1e1!3m6!1sCIABIhBsh_DLskrtRLeBpPYv9NKD!2e10!3e11!6shttps:%2F%2Flh3.googleusercontent.com%2Fgps-cs-s%2FANWiy9TBqbTIzbDWJFReXSknowOzRPKGmVt6oqN6oHNSTvkLmi48roEUBATihHNuBFHXAftYzAiYlGGkH20WE38uxvdyrO_CTPLxcYQkrveVHEwwIQojPFf1znSEA8lYG7vjqzkfNkQlANBo79I%3Dw900-h600-k-no-pi-33.38100275381959-ya18.75844551844176-ro0-fo100!7i5888!8i2944!4m13!1m2!2m1!1spier+turistico!3m9!1s0x94d8af001425b9cb:0x264039fa5f072267!8m2!3d-27.1441229!4d-48.5856612!10e5!14m1!1BCgIgARICCAI!15sCg5waWVyIHR1cmlzdGljb1oQIg5waWVyIHR1cmlzdGljb5IBEnRvdXJpc3RfYXR0cmFjdGlvbpoBRENpOURRVWxSUVVOdlpFTm9kSGxqUmpsdlQycEJlbEpyTVRWU01EVlVVbXQwYW1KRlpGaFpWMDU1VG10S1RWbHJSUkFC4AEA-gEECBYQQg!16s%2Fg%2F11yr2c7jvq?entry=ttu&g_ep=EgoyMDI2MTAxNC4wIKXMDSoASAFQAw%3D%3D",
  },
  {
    key: 'castello', site: 'https://www.castellodalpozzo.com/', name: 'Castello Dal Pozzo', place: 'Oleggio Castello · Itália', segment: 'Resort e restaurante', logo: 'logo-castello',
    lat: 45.7518584, lon: 8.5312244, heading: 196, label: [20, -20], abroad: true,
    maps: "https://www.google.com/maps/place/Castello+Dal+Pozzo/@45.7521437,8.5313718,3a,75y,154.01h,86.02t/data=!3m7!1e1!3m5!1sCIABIhBZ-GlfQrNEo_5YQE0Dz7_m!2e10!6shttps:%2F%2Flh3.googleusercontent.com%2Fgpms-cs-s%2FAM4Q-U-rayvv1wBFX2nI-ruaUIEMgtDO1BjXCEI7SaC3893B3_CvmsuHT3v0c5yKMsZyq1kSYMgmiZFiWrMdCB_KD7WqZakt8HxKtjDOMmufaJMpIBu1snUMiEcpPI73nleS1VEnH3IaH18ksc7P%3Dw900-h600-k-no-pi3.977442865435023-ya13.587692308879184-ro0-fo100!7i6530!8i3265!4m12!3m11!1s0x478671f64a13d927:0x9da3b7c69ee36550!5m2!4m1!1i2!8m2!3d45.7518584!4d8.5312244!10e5!14m1!1BCgIgARICCAI!16s%2Fg%2F11hdb9dw2_?entry=ttu&g_ep=EgoyMDI2MTAxNC4wIKXMDSoASAFQAw%3D%3D",
  },
  {
    key: 'caixadaco', site: 'https://www.caixadaco.com/', name: 'Pousada Caixa D’Aço Exclusive', place: 'Praia do Caixa D’Aço · Porto Belo', segment: 'Hospedagem',
    lat: -27.1289263, lon: -48.5252722, heading: 151, label: [44, -50], short: 'Caixa D’Aço',
    maps: "https://www.google.com/maps/place/Caixa+D'a%C3%A7o+Exclusive+Hotel/@-27.1289263,-48.5252722,3a,90y,207.33h,98.71t/data=!3m8!1e1!3m6!1sCIABIhD8GK-9e_Ry97e7zItvdMxT!2e10!3e11!6shttps:%2F%2Flh3.googleusercontent.com%2Fgpms-cs-s%2FAM4Q-U-f4Y39E8RWJ4zvxpYFWl7zO4VK5KhXnZw2_Fx1WdeTwlodonPxNipAffw4f1ApVWB_yzxiBrnYonHrQFmyb8ZkNXyCQTQhPOsjSxkjxlc3lopMZpa2qc99x1h7lkG9wRCtJS3-7RLz17lt%3Dw900-h600-k-no-pi-8.710898981191164-ya207.33073745389285-ro0-fo100!7i6080!8i3040!4m12!3m11!1s0x94d8a504e98d9a23:0xf3c4dadb2dd145f6!5m2!4m1!1i2!8m2!3d-27.1289263!4d-48.5252722!10e5!14m1!1BCgIgARICCAI!16s%2Fg%2F11fylwyrqn?entry=ttu&g_ep=EgoyMDI2MTAxNC4wIKXMDSoASAFQAw%3D%3D",
  },
  {
    key: 'portobelohall', site: 'https://portobelohall.com.br/', name: 'Porto Belo Hall', place: 'Porto Belo', segment: 'Eventos', logo: 'logo-portobelohall',
    lat: -27.1572469, lon: -48.5563231, heading: 187, label: [48, 24], short: 'Porto Belo Hall',
    maps: "https://www.google.com/maps/place/Porto+Belo+Hall/@-27.1583305,-48.5565916,3a,75y,9.09h,106.03t/data=!3m8!1e1!3m6!1sCIABIhCf24IUJGg0krRL0stLiQQV!2e10!3e11!6shttps:%2F%2Flh3.googleusercontent.com%2Fgpms-cs-s%2FAM4Q-U_l7uyHDguaWd2Ve6NxeRr1GcHpzPaHO9gOwHGLwsUVlUnZPEgi3APY1-ajH_77G93EG-Y6xBbGmb4Z1wSotHA34171oVJNrX7uyo-pvqQcqkJeAIBg4p-Vgj1duJ5UzOEwbNwK6rpONBhu%3Dw900-h600-k-no-pi-16.03289990339283-ya9.086935576504324-ro0-fo100!7i8400!8i4200!4m18!1m8!3m7!1s0x27c219b51e128b5b:0xe8f4e0bd0f6aee19!2sPorto+Belo+Hall!8m2!3d-27.1572469!4d-48.5563231!10e5!16s%2Fg%2F11x8r16rg3!3m8!1s0x27c219b51e128b5b:0xe8f4e0bd0f6aee19!8m2!3d-27.1572469!4d-48.5563231!10e5!14m1!1BCgIgARICCAI!16s%2Fg%2F11x8r16rg3?entry=ttu&g_ep=EgoyMDI2MTAxNC4wIKXMDSoASAFQAw%3D%3D",
  },
  {
    key: 'bluesea', site: 'https://www.blueseahotel.com.br/', name: 'Hotel Blue Sea', place: 'Itapema', segment: 'Hotel',
    lat: -27.0663841, lon: -48.5949144, heading: 173, label: [110, -42], short: 'Hotel Blue Sea',
    maps: "https://maps.app.goo.gl/MPgtTv3VMgMMVPsW6",
  },
];
export const CASE = Object.fromEntries(CASES.map((c) => [c.key, c]));

export const mobile = matchMedia('(max-width: 760px), (pointer: coarse)').matches;
export const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;
export const panoUrl = (k) => `assets/pano/${k}-${mobile ? '2k' : '4k'}.webp`;
