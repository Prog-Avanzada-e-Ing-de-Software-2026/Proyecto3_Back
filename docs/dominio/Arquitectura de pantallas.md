# Arquitectura de pantallas — Gym MVP

Define cómo se divide la aplicación en superficies y pantallas antes de dibujar wireframes.
Base: `docs/dominio/User Stories.md` (`HU 1`..`HU 29`) y `docs/dominio/Reglas de negocio.md` (`RN-01`..`RN-42`).

> **Nota de vigencia:** este documento se redactó contra el análisis preliminar, que numeraba las historias como `US-01`..`US-19` y las reglas como `RN-1`..`RN-26`. Las tablas siguientes conservan esa numeración. Antes de implementar cualquiera de estas pantallas hay que remapear sus referencias a las historias `HU` y a las reglas `RN-nn` vigentes.
Se apoya en los principios de producto de OpenPencil (purpose-first, región dominante, jerarquía de
acciones, estados de sistema) y en los patrones del design-system para *Fitness/Gym App*.

---

## 1. Principio rector: dos productos en uno

La app tiene **dos contextos de uso radicalmente distintos**, y la arquitectura debe respetarlo:

| Superficie | Actor | Contexto | Form factor | Prioridad de diseño |
| --- | --- | --- | --- | --- |
| **Alumno** | Alumno | En el gimnasio, de pie, manos ocupadas, apuro | **Móvil, mobile-first** | Registro rápido, baja carga cognitiva, targets grandes |
| **Staff** | Profesor / Administrador | Escritorio, planificando, datos densos | **Web, desktop-first** | Densidad, tablas, edición compleja |

**Decisión:** una sola aplicación, **una sola autenticación con redirección por rol**, y **dos shells
de navegación**. Mismo design system, distinto contenedor:

- **Shell Alumno** → *bottom navigation* (≤5 ítems), una columna dominante.
- **Shell Staff** → *rail lateral* (sidebar 240–280px) + área de trabajo con ancho completo, zonas múltiples.

Esto evita el error clásico de "una app, un menú" que termina sirviendo mal a ambos.

---

## 2. Inventario de pantallas

### 2.1 Compartidas

| ID | Pantalla | Propósito único | Acción primaria | US |
| --- | --- | --- | --- | --- |
| **S-01** | Acceso (Login) | Autenticar y enrutar por rol | Iniciar sesión | — |
| **S-02** | Recuperar contraseña | Recuperar acceso | Enviar enlace | — |

### 2.2 Shell Alumno (móvil, bottom nav)

Nav inferior: **Hoy · Mi plan · Progreso · Historial · Perfil** (5 ítems, dentro del límite recomendado).

| ID | Pantalla | Propósito único | Acción primaria | US |
| --- | --- | --- | --- | --- |
| **A-01** | Hoy (Inicio) | Ver el entrenamiento que toca y arrancarlo | Iniciar entrenamiento | US-14, US-15 (RN-12, RN-21) |
| **A-02** | Entrenamiento en curso | Registrar series del día con guía del plan y carga previa | Agregar serie | US-14, US-15 (RN-20, RN-24, RN-25, RN-26) |
| **A-03** | Finalizar entrenamiento | Confirmar el cierre e inmutabilidad | Finalizar | US-14 (RN-22) |
| **A-04** | Mi plan | Consultar el plan vigente por día | Filtrar por día | US-13 (RN-12, RN-25) |
| **A-05** | Evolución | Ver la evolución (mejor serie por sesión) y el récord de un ejercicio | Elegir ejercicio y período | US-16, US-17 |
| **A-06** | Historial | Ver la lista de entrenamientos pasados | Abrir un entrenamiento | US-18 (RN-16) |
| **A-07** | Detalle de entrenamiento | Ver qué hizo en una sesión (solo lectura) | — | US-18 (RN-22) |
| **A-08** | Perfil | Datos de cuenta y cierre de sesión | — | — |

> A-02 y A-03 son un flujo *full-screen* que se abre desde A-01; no viven en la bottom nav.

### 2.3 Shell Staff (web, rail lateral)

Nav lateral (según rol): **Panel · Alumnos · Profesores\* · Planes\*\* · Catálogo\*\***
(\* solo Administrador · \*\* según `D-01a`).

| ID | Pantalla | Propósito único | Acción primaria | US |
| --- | --- | --- | --- | --- |
| **P-01** | Panel | Ver alertas accionables del día | Resolver una alerta | US-19 (RN-9) |
| **P-02** | Alumnos | Ver y filtrar alumnos (sin plan / por vencer / vencidos) | Abrir alumno | US-19 |
| **P-03** | Detalle de alumno | Ver plan, historial, progreso y récord de ese alumno | Crear/ver plan | US-13, US-16, US-17, US-18 (RN-9) |
| **P-04** | Planes | Listar, copiar y eliminar planes del profesor | Crear plan / copiar plan | US-12 (RN-7) |
| **P-05** | Constructor de plan | Armar/editar un plan (días, bloques, progresión) | Guardar plan | US-12 (RN-1..RN-8, RN-10, RN-13, RN-23) |
| **P-06** | Ver plan de alumno | Ver el plan asignado en modo lectura | — | US-13 |
| **AD-01** | Alumnos (ABM) | Alta / baja / reactivar alumnos | Alta de alumno | US-06, US-07, US-08 (RN-16, RN-17, RN-19) |
| **AD-02** | Profesores (ABM) | Alta / baja de profesores | Alta de profesor | US-09, US-10 (RN-15, RN-18) |
| **AD-03** | Reasignación | Reasignar alumnos sin profesor | Asignar profesor | US-11 (RN-15) |
| **AD-04** | Catálogo | Gestionar el catálogo maestro (5 CRUDs) | Crear ítem | US-01..US-05 |

> **AD-04 Catálogo** agrupa 5 entidades. Recomendación: **un solo shell con pestañas**
> (*Máquinas · Ejercicios · Categorías · Objetivos · Unidades*), cada pestaña una tabla + panel/modal
> de edición. Evita 5 pantallas casi idénticas.

---

## 3. Mapa de navegación

```
S-01 Acceso ──rol──┬─► SHELL ALUMNO (bottom nav)
                   │     A-01 Hoy ─┬─► A-02 Entrenamiento ──► A-03 Finalizar
                   │               ├─► A-04 Mi plan
                   │               ├─► A-05 Progreso (evolución + récord)
                   │               ├─► A-06 Historial ──► A-07 Detalle
                   │               └─► A-08 Perfil
                   │
                   └─► SHELL STAFF (rail)
                         P-01 Panel ──► P-02 Alumnos ──► P-03 Detalle alumno ──► P-06 Ver plan
                                      P-04 Planes ├─► P-05 Constructor de plan
                                      AD-01 Alumnos (ABM)
                                      AD-02 Profesores (ABM)
                                      AD-03 Reasignación
                                      AD-04 Catálogo (pestañas)
```

---

## 4. Flujos clave

1. **Registrar entrenamiento (alumno)** — A-01 → A-02 → A-03.
   Dominante: la lista de ejercicios del día con carga objetivo. Cada ítem muestra la **última carga
   usada** (todas las series previas). El alumno puede agregar cualquier ejercicio del catálogo (RN-26).
2. **Armar un plan (profesor)** — P-04 → P-05.
   El flujo más complejo. Requiere: elegir días (1–5), armar bloques movilidad/core (compartidos)
   y fuerza (por día), definir progresión semanal (entre 4 y 12 semanas), validar las tres partes obligatorias.
3. **Detectar alumnos que necesitan plan (profesor)** — P-01 → P-02 → P-05.
   Arranca en el Panel con las alertas de `US-19`.
4. **Alta/baja de persona (administrador)** — AD-01 / AD-02 → AD-03 si corresponde.
5. **Ver progreso (alumno o profesor)** — A-05 (o P-03) → elegir ejercicio → gráfico.

---

## 5. Estados transversales (obligatorios por superficie de datos)

Toda pantalla con datos debe diseñar, además del caso poblado:

- **Cargando** (skeleton)
- **Vacío** (ícono + una línea de motivo + CTA para crear el primero)
- **Error** (mismo marco que vacío, ícono y mensaje distintos)
- **Sin permiso** (RN-9: otro alumno / otro profesor)
- **Confirmación** (guardado, finalización de entrenamiento)

---

## 6. Dirección visual preliminar (a validar; los wireframes serán de baja fidelidad)

Del design-system para *Fitness/Gym App*:

- **Estilo**: Vibrant & Block-based, con soporte de modo claro y oscuro.
- **Color**: primario naranja `#F97316`, acento/éxito verde `#22C55E`, destructivo `#EF4444`,
  neutrales slate (`#0F172A` / `#F8FAFC`).
- **Tipografía**: **Barlow Condensed** (títulos, deportivo/condensado) + **Barlow** (cuerpo).
- **Densidad**: Alumno → *airy/medium* (pocos ítems, targets grandes). Staff → *compact* (tablas).
- **Evitar**: diseño estático sin feedback; íconos con emoji; depender solo del color.

---

## 6.1 Correcciones de dominio aplicadas (post `Analisis de dominio.md`)

- **"Día del plan" no es un día de la semana.** Es el 1.º, 2.º o n.º día que el alumno asiste. Los
  filtros de `A-04 Mi plan` son **Día 1 / Día 2 / …**, no "Lun/Mié/Vie".
- **La prescripción del plan no incluye peso.** `Prescripción semanal (VO)` = series + cantidad
  objetivo (rango + unidad) + RIR + descanso. El **peso lo registra el alumno** al ejecutar. Por eso
  las pantallas muestran objetivos como `4x8-10 · RIR 2`, y el peso aparece solo como *última carga*
  o en el historial.
- **Evolución = mejor serie por sesión**, no todas las series. El gráfico grafica un punto por
  entrenamiento; la **lista de sesiones** sí muestra todas las series. Sin peso, el eje Y es la
  cantidad y desaparece el toggle de volumen. Volumen es métrica secundaria opcional.
- **Número de plan:** los planes de un alumno se numeran sucesivamente (plan 1, 2, …).
- **Tab "Progreso"** del bottom nav abre la pantalla **Evolución** (`A-05`).

## 7. Pendientes que afectan la arquitectura

| ID | Pendiente | Impacto en pantallas |
| --- | --- | --- |
| `D-01a` | ¿Quién gestiona el Catálogo (Admin o Profesor)? | Decide si `AD-04` existe para Admin, Profesor o ambos |
| `D-04a` | ¿El listado de P-02 distingue "sin plan / vence / vencido"? | Filtros y badges de P-02 |
| `D-05` | ¿Reasignación automática al reactivar alumno? | Flujo de AD-01 → AD-03 |

---

## 8. Orden de wireframing propuesto

1. **S-01** Acceso (transversal, define el sistema visual base).
2. **A-01 / A-02 / A-03** — el flujo de registro, el de mayor uso real.
3. **A-04 / A-05 / A-06** — consulta del alumno.
4. **P-01 / P-02 / P-03** — alertas y detalle de alumno.
5. **P-04 / P-05** — constructor de plan (el más complejo, se deja con contexto ya armado).
6. **AD-01 / AD-02 / AD-03 / AD-04** — administración.

> Cada pantalla se dibujará en **versión móvil (alumno)** o **web (staff)** según su shell, con estado
> poblado + un estado vacío donde aplique.
