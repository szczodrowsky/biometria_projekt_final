import { initializeApp } from "firebase/app";
import { getFirestore, collection, addDoc, getDocs } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyD0MWh2PFruua4VOpeB7ybNMx4vRSQH-SE",
  authDomain: "biometria2023-d494c.firebaseapp.com",
  projectId: "biometria2023-d494c",
  storageBucket: "biometria2023-d494c.appspot.com",
  messagingSenderId: "529700105899",
  appId: "1:529700105899:web:2f4f7a386fb2f16ddfd1ee",
};

initializeApp(firebaseConfig);
const db = getFirestore();

const data = {
  clicks: [],
  timeBetween: [],
  timeTotal: [],
};

let startTime = null;
let formLoaded = false;

document.addEventListener("DOMContentLoaded", function () {
  const logowanie = document.getElementById("logowanie");
  const rejestracja = document.getElementById("rejestracja");

  if (logowanie) {
    logowanie.addEventListener("click", function () {
      window.location.href = "login.html";
    });
  }
  if (rejestracja) {
    rejestracja.addEventListener("click", function () {
      window.location.href = "register.html";
    });
  } else {
    console.error(
      "Element o identyfikatorze 'przycisk' nie został odnaleziony."
    );
  }

  formLoaded = true;
});

const buttons = document.querySelectorAll(".btn");
const registerBtn = document.getElementById("zarejestruj");

document.addEventListener("DOMContentLoaded", function () {
  formLoaded = true;
});

buttons.forEach((button) => {
  button.addEventListener("click", async (event) => {
    if (!formLoaded) {
      console.error("Formularz rejestracji nie został jeszcze załadowany!");
      return;
    }

    const currentTime = Date.now();

    if (startTime !== null) {
      const timeDiff = currentTime - startTime;
      data.timeBetween.push(timeDiff);
    } else {
      startTime = currentTime;
    }

    if (!data.clicks.some((click) => click.id === button.id)) {
      const clickData = {
        id: button.id,
        x: event.clientX,
        y: event.clientY,
      };
      data.clicks.push(clickData);
      button.disabled = true;
    }
    if (data.clicks.length === buttons.length) {
      const totalTime =
        data.timeBetween.reduce((acc, time) => acc + time, 0) / 1000;
      data.timeTotal.push(totalTime);
    }
    console.log(data);
  });
});

if (registerBtn) {
  registerBtn.addEventListener("click", async () => {
    try {
      const docRef = await addDoc(collection(db, "biometryczne"), data);
      registerBtn.disabled = true;
      console.log("Dane zostały dodane do Firebase! Document ID:", docRef.id);
      data.clicks = [];
      data.timeBetween = [];
      data.timeTotal = [];
      startTime = null;
      setTimeout(() => {
        window.location.href = "opening.html";
      }, 3000);
    } catch (error) {
      console.error("Błąd podczas dodawania danych do Firebase:", error);
    }
  });
}
const colRef = collection(db, "biometryczne");
const loginBtn = document.getElementById("zaloguj");

const wynikDiv = document.getElementById("wynik");

if (loginBtn) {
  loginBtn.addEventListener("click", async () => {
    try {
      getDocs(colRef).then((snapshot) => {
        if (snapshot.docs.length === 0) {
          console.log("Brak danych w bazie.");
          return;
        }

        let books = [];
        snapshot.docs.forEach((doc) => {
          books.push({ ...doc.data() });
        });
        // to jak już bedzie wystylowane bedzie trzeba poedytować :D
        const tolerance = {
          clicksX: 1000,
          clicksY: 1000,
          timeBetween: 200,
          totalTime: 100,
        };

        if (!books[0]?.clicks || books[0].clicks.length === 0) {
          console.log("Brak danych kliknięć w bazie.");
          return;
        }

        const clicksMatch = data.clicks.every((click, index) => {
          const bookClick = books[0].clicks[index];

          if (click && bookClick) {
            return (
              String(click.id) === String(bookClick.id) &&
              Math.abs(click.x - bookClick.x) <= tolerance.clicksX &&
              Math.abs(click.y - bookClick.y) <= tolerance.clicksY
            );
          }

          return false;
        });

        const timeBetweenMatch =
          Math.abs(data.timeBetween[0] - books[0].timeBetween[0]) <=
          tolerance.timeBetween;

        const totalTimeMatch =
          Math.abs(data.timeTotal[0] - books[0].timeTotal[0]) <=
          tolerance.totalTime;

        if (clicksMatch && timeBetweenMatch && totalTimeMatch) {
          console.log("Dane są zgodne z tolerancją.");
          wynikDiv.innerHTML = "Dane są zgodne z tolerancją.";
          console.log("Wynik ustawiony!");
        } else {
          console.log("Dane są różne z tolerancją.");
          wynikDiv.innerHTML = "Dane nie są zgodne z tolerancją.";
          console.log("Wynik ustawiony!");
        }

        console.log(books);
      });
    } catch (error) {
      console.error("Błąd podczas pobierania danych z Firebase:", error);
    }
  });
}
