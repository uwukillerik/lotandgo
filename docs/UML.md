# Lot&Go — UML-диаграммы

Только три типа: **прецеденты**, **деятельность**, **последовательность**.  
Исходники PlantUML — в [`docs/uml/`](uml/).

## Экспорт в PNG / SVG

1. [plantuml.com/plantuml](https://www.plantuml.com/plantuml/uml) — вставить текст `.puml` → скачать
2. Расширение **PlantUML** в Cursor → Export Current Diagram
3. CLI: `plantuml docs/uml/*.puml -o images`

---

## Прецеденты (Use Case)

| Файл | Содержание |
|------|------------|
| [use-case.puml](uml/use-case.puml) | Гость, покупатель, продавец, админ и все основные сценарии |

---

## Деятельность (Activity)

| Файл | Содержание |
|------|------------|
| [activity-register.puml](uml/activity-register.puml) | Регистрация и вход |
| [activity-bid.puml](uml/activity-bid.puml) | Размещение ставки |
| [activity-auction.puml](uml/activity-auction.puml) | Жизненный цикл аукциона: создание → торги → завершение → сделка |

---

## Последовательность (Sequence)

| Файл | Содержание |
|------|------------|
| [sequence-register.puml](uml/sequence-register.puml) | Регистрация пользователя |
| [sequence-bid.puml](uml/sequence-bid.puml) | Ставка + WebSocket |
| [sequence-auction-end.puml](uml/sequence-auction-end.puml) | Автозавершение торгов и кошелёк |
| [sequence-promotion.puml](uml/sequence-promotion.puml) | Покупка продвижения лота |

---

## Для пояснительной записки

| Глава | Диаграммы |
|-------|-----------|
| Анализ предметной области | `use-case.puml` |
| Проектирование процессов | `activity-*.puml` |
| Проектирование взаимодействия | `sequence-*.puml` |

Экспортируйте в **SVG** для чёткой печати в PDF.
