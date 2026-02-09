import { MermaidCode } from "@/types/DiagramTypes";

export interface DiagramTemplate {
    id: string;
    label: string;
    icon: string;
    code: MermaidCode;
}

export const DIAGRAM_TEMPLATES: DiagramTemplate[] = [
    {
        id: 'sequence',
        label: 'Sequence Diagram',
        icon: '↕️',
        code: `sequenceDiagram
    participant User
    participant System
    participant Database

    User->>System: Login Request
    System->>Database: Check Credentials
    Database-->>System: OK
    System-->>User: Auth Token`
    },
    {
        id: 'flowchart',
        label: 'Flowchart',
        icon: '⇶',
        code: `flowchart TD
    A[Christmas] -->|Get money| B(Go shopping)
    B --> C{Let me think}
    C -->|One| D[Laptop]
    C -->|Two| E[iPhone]
    C -->|Three| F[fa:fa-car Car]`
    },
    {
        id: 'class',
        label: 'Class Diagram',
        icon: '📦',
        code: `classDiagram
    Animal <|-- Duck
    Animal <|-- Fish
    Animal <|-- Zebra
    Animal : +int age
    Animal : +String gender
    Animal: +isMammal()
    Animal: +mate()
    class Duck{
        +String beakColor
        +swim()
        +quack()
    }
    class Fish{
        -int sizeInFeet
        -canEat()
    }
    class Zebra{
        +bool is_wild
        +run()
    }`
    },
    {
        id: 'state',
        label: 'State Diagram',
        icon: '🔄',
        code: `stateDiagram-v2
    [*] --> Still
    Still --> [*]
    Still --> Moving
    Moving --> Still
    Moving --> Crash
    Crash --> [*]`
    },
    {
        id: 'er',
        label: 'ER Diagram',
        icon: '🗄️',
        code: `erDiagram
    CUSTOMER ||--o{ ORDER : places
    ORDER ||--|{ LINE-ITEM : contains
    CUSTOMER }|..|{ DELIVERY-ADDRESS : uses`
    },
    {
        id: 'gantt',
        label: 'Gantt Chart',
        icon: '📅',
        code: `gantt
    title A Gantt Diagram
    dateFormat  YYYY-MM-DD
    section Section
    A task           :a1, 2014-01-01, 30d
    Another task     :after a1  , 20d
    section Another
    Task in sec      :2014-01-12  , 12d
    another task      : 24d`
    },
    {
        id: 'mindmap',
        label: 'Mindmap',
        icon: '🧠',
        code: `mindmap
  root((mindmap))
    Origins
      Long history
      ::icon(fa fa-book)
      Popularisation
        British popular psychology author Tony Buzan
    Research
      On effectivness and features
      On Automatic creation
        Uses
            Creative techniques
            Strategic planning
            Argument mapping
    Tools
      Pen and paper
      Mermaid`
    }
];
