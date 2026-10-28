# GymProgress – podatkovni model

## Uporabniški profil in avtentikacija

`USERS` predstavlja aplikacijski profil uporabnika. Njegov `id` se navezuje
na `auth.users.id` v Supabase Auth, ki upravlja prijavne podatke in seje.
Gesel oziroma njihovih zgoščenih vrednosti ne shranjujemo v aplikacijski
tabeli. Polje `email` v profilu je kontaktni podatek; vir prijavne identitete
ostaja Supabase Auth. Utemeljitev: [ADR 0002](adr/0002-avtentikacija-supabase-auth.md).

## Osnutek podatkovnega modela (Mermaid ER)

```mermaid
erDiagram
    USERS ||--o{ WORKOUT_PROGRAMS : ustvari
    USERS ||--o{ WORKOUT_SESSIONS : opravi
    USERS ||--o{ TRAINER_CLIENTS : trener
    USERS ||--o{ TRAINER_CLIENTS : stranka
    USERS ||--o{ PROGRAM_ASSIGNMENTS : prejemnik
    USERS ||--o{ PROGRAM_ASSIGNMENTS : dodeli
    WORKOUT_PROGRAMS ||--o{ PROGRAM_EXERCISES : vsebuje
    EXERCISES ||--o{ PROGRAM_EXERCISES : vključena_v
    WORKOUT_PROGRAMS ||--o{ PROGRAM_ASSIGNMENTS : dodeljen_kot
    WORKOUT_PROGRAMS ||--o{ WORKOUT_SESSIONS : osnova_za
    WORKOUT_SESSIONS ||--o{ WORKOUT_SETS : vsebuje
    EXERCISES ||--o{ WORKOUT_SETS : izvedena_kot

    USERS {
        uuid id PK
        string email UK
        string role
        datetime created_at
    }
    TRAINER_CLIENTS {
        uuid id PK
        uuid trainer_id FK
        uuid client_id FK
        string status
        datetime created_at
    }
    EXERCISES {
        uuid id PK
        string name
        string muscle_group
        string equipment
    }
    WORKOUT_PROGRAMS {
        uuid id PK
        uuid owner_id FK
        string name
        string description
        datetime created_at
    }
    PROGRAM_EXERCISES {
        uuid id PK
        uuid program_id FK
        uuid exercise_id FK
        int position
        int target_sets
        int target_reps
    }
    PROGRAM_ASSIGNMENTS {
        uuid id PK
        uuid program_id FK
        uuid trainee_id FK
        uuid assigned_by FK
        datetime assigned_at
    }
    WORKOUT_SESSIONS {
        uuid id PK
        uuid trainee_id FK
        uuid program_id FK
        datetime started_at
        datetime completed_at
        decimal total_volume_kg
    }
    WORKOUT_SETS {
        uuid id PK
        uuid session_id FK
        uuid exercise_id FK
        int set_number
        int reps
        decimal weight_kg
    }
```

