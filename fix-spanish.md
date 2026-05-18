En src/app/api/mapa-capilar/analyze/route.ts, en la constante PASS1_SYSTEM, 
agrega esta linea al final del string:

"Always respond in Spanish. All observations, labels, descriptions and clinical 
terms must be written in Spanish."

Y en la funcion buildPass2User, en la primera linea del template string despues 
de "Convert the narrative into this exact JSON", agrega:

"All text values in the JSON must be written in Spanish, including labels, 
status descriptions, notes, and observations. Only exception: keep field names 
in English as shown in the schema."