# ⚡ AynovaX Prime | Industrial IoT Digital Twin

> **[English]** A high-performance dashboard for predictive maintenance.
> **[Español]** Un tablero de alto rendimiento para mantenimiento predictivo.

---

<div align="center">
  <video src="media/Video.mp4" width="100%" controls autoplay loop muted></video>
</div>

---

## 🇬🇧 English Description

### What is this?
AynovaX Prime is a **Digital Twin** prototype designed to monitor industrial machinery in real-time. It simulates high-frequency sensor data (Temperature, Pressure, Vibration) and uses a Python backend to predict failures before they happen.

### The Problem it Solves
In industrial settings, two things usually happen:
1.  **Browser Lag:** Dashboards often freeze when receiving thousands of data points per second.
2.  **Context Gap:** Operators see "Vibration: 50Hz" but don't know how much money that inefficiency is costing the company right now.

### How it Helps
* **Zero-Lag Rendering:** I built a custom React architecture using memoization to handle high-frequency updates without freezing the browser.
* **Financial Velocity:** It doesn't just show errors; it calculates the **real-time financial impact** (USD) of machine performance.
* **Safety First:** Includes an automated **SCRAM** protocol (emergency shutdown) if the system detects 4 consecutive critical failures.

### Future Evolution 🚀
* **Real Connectivity:** Replacing the simulation engine with an MQTT broker to connect real PLCs (Siemens/Allen-Bradley).
* **Edge Computing:** Moving the inference logic to run locally on a Raspberry Pi for lower latency.
* **Docker:** Containerizing the app for easier deployment on factory servers.

### Tech Stack
* **Frontend:** React + TailwindCSS (Custom "Carbon" UI).
* **Backend:** Python (FastAPI) + SQLModel (SQLite).
* **Data Viz:** Recharts (Optimized for real-time streams).

---

## 🇪🇸 Descripción en Español

### ¿Qué es esto?
AynovaX Prime es un prototipo de **Gemelo Digital** diseñado para monitorear maquinaria industrial en tiempo real. Simula datos de sensores de alta frecuencia (Temperatura, Presión, Vibración) y utiliza un backend en Python para predecir fallas antes de que ocurran.

### Qué problema resuelve
En la industria suelen pasar dos cosas:
1.  **Lentitud:** Los tableros web se traban cuando reciben miles de datos por segundo.
2.  **Falta de Contexto:** Los operadores ven "Vibración: 50Hz" pero no saben cuánto dinero le está costando esa ineficiencia a la empresa en ese momento.

### En qué ayuda
* **Renderizado Zero-Lag:** Diseñé una arquitectura en React optimizada (memoización) para manejar actualizaciones rápidas sin congelar el navegador.
* **Velocidad Financiera:** No solo muestra errores; calcula el **impacto financiero en tiempo real** (USD) del rendimiento de la máquina.
* **Seguridad:** Incluye un protocolo **SCRAM** (apagado de emergencia) automático si el sistema detecta 4 fallos críticos seguidos.

### Cómo puede evolucionar 🚀
* **Conectividad Real:** Reemplazar el motor de simulación con un broker MQTT para conectar PLCs reales (Siemens/Allen-Bradley).
* **Edge Computing:** Mover la lógica de inferencia para que corra localmente en una Raspberry Pi y reducir la latencia.
* **Docker:** Contenerizar la aplicación para desplegarla fácil en servidores de fábrica.

### Tecnologías
* **Frontend:** React + TailwindCSS (Interfaz personalizada estilo "Carbono").
* **Backend:** Python (FastAPI) + SQLModel (SQLite).
* **Visualización:** Recharts (Optimizado para flujos en tiempo real).
