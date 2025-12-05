# App da Escola — Projeto

**Descrição:**  
Aplicativo protótipo para escola que apresenta informações sobre cursos, possui login local para alunos, sistema de ponto (presença) com checagem por geolocalização e painel administrativo para a secretaria.

---

## Link do apk

https://expo.dev/artifacts/eas/6vEWUHy3RDphhCJUATqsXY.apk

---

## Como rodar (desenvolvimento)

1. Instale Node.js e Git.
2. Clone o repositório:

git clone https://github.com/pabvini/app-da-escola.git
cd app-da-escola

3. Instale dependências:

npm install
expo install expo-location
npm install @react-navigation/native @react-navigation/stack
expo install react-native-gesture-handler react-native-safe-area-context react-native-screens
npm install @react-native-async-storage/async-storage

4. Inicie o app:

npm start
Abra no celular com Expo Go ou emulador.

---

## Usuários de testes
- aluno1 / 1234 (aluno)
- aluno2 / 1234 (aluno)
- secretaria / admin123 (admin)

---

## Equipe e contribuições

- **Pablo Vinicius (Pab Vini)** — *Líder do projeto e desenvolvedor principal*: integracao com geolocalização, lógica de check-in e testes finais.

- **Murilo Chaves** — *Design & UI*: definiu paleta de cores, estilos do app e organização das telas.

- **Samuel Alencar** — *Frontend & navegação*: implementou navegação entre telas e componentes reutilizáveis.

- **Antônio Marcos** — *Documentação & README*: escreveu instruções de execução, testes e orientou a geração do APK.

- **José Guilherme** — *Qualidade & testes*: testou o app em dispositivos físicos, reportou bugs e validou fluxo de presença.


---

## Observações finais
- O app usa armazenamento local (AsyncStorage). Para produção, recomenda-se adicionar backend (API) e autenticação segura.
- Atualize `SCHOOL_CONFIG` em `App.js` com as coordenadas reais da escola.
