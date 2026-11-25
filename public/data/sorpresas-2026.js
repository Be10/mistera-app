/* MISTERA V33 — 25 experiencias editables; dias 01/02 aprobados. */
window.MISTERA_SURPRISES_SEED = {
  "schemaVersion": 1,
  "revision": "V23",
  "calendarYear": 2026,
  "timezone": "America/Lima",
  "environment": "BORRADOR_LOCAL",
  "privacy": "NO_PUBLICAR",
  "updatedBy": "plan inicial del usuario",
  "days": [
    {
      "day": 1,
      "date": "2026-12-01",
      "unlockAt": "2026-12-01T00:00:00-05:00",
      "title": "Raspa y descubre: una tarde de cine",
      "description": "Raspadita que revela la película Los juegos del hambre: Amanecer en la cosecha; después, las entradas para ir juntos al cine el 1 de diciembre.",
      "planningStatus": "DEFINIDO",
      "publicationStatus": "PUBLICADO",
      "availabilityStatus": "PROGRAMADO",
      "experienceType": "SCRATCH_CINE",
      "minigameType": "scratch",
      "animation": "soft-reveal",
      "transition": "fade",
      "audioBehavior": "inherit",
      "editorNotes": "",
      "mediaPending": [],
      "blocks": [
        {
          "type": "scratch",
          "title": "Una película nos espera",
          "body": "Raspa para descubrir qué veremos juntos.",
          "image": "",
          "audio": "",
          "video": "",
          "requires": "",
          "transition": "fade",
          "effect": "soft",
          "audioBehavior": "inherit",
          "message": "Los juegos del hambre: Amanecer en la cosecha",
          "threshold": 0.42,
          "coverText": "Raspa para descubrir",
          "mediaLabel": "Portada de la película pendiente (recurso autorizado)",
          "id": "d01-01"
        },
        {
          "type": "reveal",
          "title": "La película sorpresa",
          "body": "Los juegos del hambre: Amanecer en la cosecha",
          "image": "",
          "audio": "",
          "video": "",
          "requires": "d01-01",
          "transition": "fade",
          "effect": "soft",
          "audioBehavior": "inherit",
          "mediaLabel": "Portada oficial pendiente",
          "id": "d01-02"
        },
        {
          "type": "tickets",
          "title": "Nuestras entradas al cine",
          "body": "Dos entradas para ir juntos al cine el 1 de diciembre.",
          "image": "",
          "audio": "",
          "video": "",
          "requires": "d01-01",
          "transition": "fade",
          "effect": "soft",
          "audioBehavior": "inherit",
          "date": "2026-12-01",
          "status": "PENDIENTE_RECURSO",
          "mediaLabel": "Entradas reales pendientes de adjuntar",
          "id": "d01-03"
        }
      ],
      "specialExperience": "cinema-v33",
      "cinema": {
        "cover": "assets/sorpresas/dia-01/Cover.jpg",
        "overlay": "assets/sorpresas/dia-01/Title.png",
        "poster": "assets/sorpresas/dia-01/Movie_Cover.jpg",
        "scratchInstruction": "Raspa con tu dedito para descubrir lo que nos espera…",
        "scratchCoverText": "RASPA AQUÍ ✨",
        "scratchThreshold": 0.68,
        "flipPrompt": "Toca la tarjeta para descubrir un mensaje ❤️",
        "letter": "Quiero empezar el primer día de Diciembre contigo, así que hoy nos toca una tarde de cine, vayamos a ver juntos esta película que tanto deseábamos ver.",
        "movie": "LOS JUEGOS DEL HAMBRE: AMANECER EN LA COSECHA",
        "date": "2026-12-01",
        "time": "06:30 PM",
        "room": "03",
        "seats": "H09 💝 H10",
        "ticketNote": "Una película, dos asientos y una tarde juntos. ❤️"
      }
    },
    {
      "day": 2,
      "date": "2026-12-02",
      "unlockAt": "2026-12-02T00:00:00-05:00",
      "title": "Una búsqueda muy dulce",
      "description": "Acertijo para encontrar Blancaflor Picoteo; marcar Encontrado desbloquea una notita romántica.",
      "planningStatus": "DEFINIDO",
      "publicationStatus": "PUBLICADO",
      "availabilityStatus": "PROGRAMADO",
      "experienceType": "ACERTIJO_REGALO",
      "minigameType": "riddle",
      "animation": "soft-reveal",
      "transition": "fade",
      "audioBehavior": "inherit",
      "editorNotes": "",
      "mediaPending": [],
      "blocks": [
        {
          "type": "riddle",
          "title": "¿Dónde está tu regalo?",
          "body": "El acertijo será escrito por el emisor. No se ha configurado la respuesta.",
          "image": "",
          "audio": "",
          "video": "",
          "requires": "",
          "transition": "fade",
          "effect": "soft",
          "audioBehavior": "inherit",
          "question": "",
          "answer": "",
          "hint": "",
          "id": "d02-01"
        },
        {
          "type": "physical",
          "title": "Encuentra Blancaflor Picoteo",
          "body": "Trocitos de panetón cubiertos de chocolate.",
          "image": "",
          "audio": "",
          "video": "",
          "requires": "d02-01",
          "transition": "fade",
          "effect": "soft",
          "audioBehavior": "inherit",
          "item": "Blancaflor Picoteo",
          "foundLabel": "Ya lo encontré",
          "id": "d02-02"
        },
        {
          "type": "letter",
          "title": "Una notita para mi pollita",
          "body": "",
          "image": "",
          "audio": "",
          "video": "",
          "requires": "d02-02",
          "transition": "fade",
          "effect": "soft",
          "audioBehavior": "inherit",
          "mediaLabel": "Carta romántica pendiente",
          "id": "d02-03"
        }
      ],
      "specialExperience": "secret-v33",
      "secret": {
        "openPrompt": "Toca esta cartita para descubrir tu acertijo",
        "riddle": "No todo tesoro brilla,\nni todo secreto tiene llave.\nA veces, para encontrar algo,\nbasta mirar donde nadie sabe.\n\nA un costado de nuestra mesa,\ndonde hay mucho por guardar,\nun pequeño secreto, desde lo alto,\naguarda a que lo vengas a encontrar. ❤️",
        "hints": [
          "No necesitas entrar a la cocina, pero estás muy cerquita.",
          "Mira a la izquierda de nuestra mesa del comedor, donde descansan los platos, tazas y vasos.",
          "Tu sorpresa está un poquito más arriba. 💗"
        ],
        "foundNote": "¡Lo encontraste, mi pollita! 🥰\n\nQuería sorprenderte con este dulcecito peculiar, porque sé que te llamó la atención. Aunque hoy el regalo sea de chocolate, lo más dulce de mis días sigue siendo compartirlos contigo, mi vida. 🤗💗\n\nEspero haberte sacado una sonrisita, mi esposita hermosa. ✨\n\nTe amo muchísimo, mi pollita. 💝"
      }
    },
    {
      "day": 3,
      "date": "2026-12-03",
      "unlockAt": "2026-12-03T00:00:00-05:00",
      "title": "Una Navidad para recordar",
      "description": "Notita romántica con una fotografía de la Navidad anterior en el reverso.",
      "planningStatus": "DEFINIDO",
      "publicationStatus": "BORRADOR",
      "availabilityStatus": "PROGRAMADO",
      "experienceType": "CARTA_REVERSO",
      "minigameType": "none",
      "animation": "soft-reveal",
      "transition": "fade",
      "audioBehavior": "inherit",
      "editorNotes": "",
      "mediaPending": [
        "cartita",
        "foto Navidad anterior"
      ],
      "blocks": [
        {
          "type": "flip-letter",
          "title": "Dale la vuelta a esta notita",
          "body": "",
          "image": "",
          "audio": "",
          "video": "",
          "requires": "",
          "transition": "fade",
          "effect": "soft",
          "audioBehavior": "inherit",
          "backText": "",
          "mediaLabel": "Foto real de la Navidad anterior pendiente",
          "id": "d03-01"
        }
      ]
    },
    {
      "day": 4,
      "date": "2026-12-04",
      "unlockAt": "2026-12-04T00:00:00-05:00",
      "title": "Si nos dejan",
      "description": "Dedicatoria especial con la canción Si nos dejan, de José Alfredo Jiménez. El audio debe aportarse con los derechos correspondientes.",
      "planningStatus": "DEFINIDO",
      "publicationStatus": "BORRADOR",
      "availabilityStatus": "PROGRAMADO",
      "experienceType": "DEDICATORIA_MUSICAL",
      "minigameType": "none",
      "animation": "soft-reveal",
      "transition": "fade",
      "audioBehavior": "inherit",
      "editorNotes": "",
      "mediaPending": [
        "dedicatoria personal",
        "audio autorizado"
      ],
      "blocks": [
        {
          "type": "music",
          "title": "Una canción para nosotros",
          "body": "",
          "image": "",
          "audio": "",
          "video": "",
          "requires": "",
          "transition": "fade",
          "effect": "soft",
          "audioBehavior": "inherit",
          "songTitle": "Si nos dejan",
          "artist": "José Alfredo Jiménez",
          "mediaLabel": "Grabación autorizada pendiente",
          "id": "d04-01"
        }
      ]
    },
    {
      "day": 5,
      "date": "2026-12-05",
      "unlockAt": "2026-12-05T00:00:00-05:00",
      "title": "Nuestro mes de espositos ❤️",
      "description": "Acertijo romántico que revela un cupón de almuerzo en Manos Piuranas y una notita adicional.",
      "planningStatus": "DEFINIDO",
      "publicationStatus": "BORRADOR",
      "availabilityStatus": "PROGRAMADO",
      "experienceType": "ACERTIJO_VALE",
      "minigameType": "riddle",
      "animation": "soft-reveal",
      "transition": "fade",
      "audioBehavior": "inherit",
      "editorNotes": "",
      "mediaPending": [
        "acertijo y respuesta",
        "nota romántica"
      ],
      "blocks": [
        {
          "type": "riddle",
          "title": "Una pista para nuestro mes",
          "body": "Acertijo pendiente de personalizar.",
          "image": "",
          "audio": "",
          "video": "",
          "requires": "",
          "transition": "fade",
          "effect": "soft",
          "audioBehavior": "inherit",
          "question": "",
          "answer": "",
          "hint": "",
          "id": "d05-01"
        },
        {
          "type": "voucher",
          "title": "Un almuerzo juntos",
          "body": "Manos Piuranas · Súper Trío Marino, Causa de Pulpo al Olivo e Inca Kola.",
          "image": "",
          "audio": "",
          "video": "",
          "requires": "d05-01",
          "transition": "fade",
          "effect": "soft",
          "audioBehavior": "inherit",
          "place": "Manos Piuranas",
          "conditions": "Canjear cuando acordemos la fecha.",
          "redeemable": true,
          "id": "d05-02"
        },
        {
          "type": "letter",
          "title": "Una notita para hoy",
          "body": "",
          "image": "",
          "audio": "",
          "video": "",
          "requires": "d05-01",
          "transition": "fade",
          "effect": "soft",
          "audioBehavior": "inherit",
          "id": "d05-03"
        }
      ]
    },
    {
      "day": 6,
      "date": "2026-12-06",
      "unlockAt": "2026-12-06T00:00:00-05:00",
      "title": "Nuestra pequeña familia",
      "description": "Rompecabezas con una ilustración de mi pollita, nuestra gatita Nessa y yo al estilo Studio Ghibli. Al completarlo, se revela una notita al reverso.",
      "planningStatus": "PROPUESTA",
      "publicationStatus": "BORRADOR",
      "availabilityStatus": "PROGRAMADO",
      "experienceType": "ROMPECABEZAS",
      "minigameType": "puzzle",
      "animation": "soft-reveal",
      "transition": "fade",
      "audioBehavior": "inherit",
      "editorNotes": "",
      "mediaPending": [
        "ilustración familiar",
        "notita"
      ],
      "blocks": [
        {
          "type": "puzzle",
          "title": "Completa nuestra imagen",
          "body": "",
          "image": "",
          "audio": "",
          "video": "",
          "requires": "",
          "transition": "fade",
          "effect": "soft",
          "audioBehavior": "inherit",
          "pieces": 9,
          "mediaLabel": "Ilustración familiar autorizada pendiente",
          "id": "d06-01"
        },
        {
          "type": "flip-letter",
          "title": "Juntos somos hogar",
          "body": "",
          "image": "",
          "audio": "",
          "video": "",
          "requires": "d06-01",
          "transition": "fade",
          "effect": "soft",
          "audioBehavior": "inherit",
          "mediaLabel": "Dedicatoria pendiente",
          "id": "d06-02"
        }
      ]
    },
    {
      "day": 7,
      "date": "2026-12-07",
      "unlockAt": "2026-12-07T00:00:00-05:00",
      "title": "Un detalle inspirado en Claude Monet",
      "description": "Regalo todavía no elegido. No se confirma producto.",
      "planningStatus": "PROPUESTA",
      "publicationStatus": "BORRADOR",
      "availabilityStatus": "PROGRAMADO",
      "experienceType": "FISICO_PENDIENTE",
      "minigameType": "none",
      "animation": "soft-reveal",
      "transition": "fade",
      "audioBehavior": "inherit",
      "editorNotes": "",
      "mediaPending": [
        "regalo por elegir"
      ],
      "blocks": [
        {
          "type": "physical",
          "title": "Una inspiración impresionista",
          "body": "Regalo físico o digital pendiente de elegir.",
          "image": "",
          "audio": "",
          "video": "",
          "requires": "",
          "transition": "fade",
          "effect": "soft",
          "audioBehavior": "inherit",
          "item": "",
          "mediaLabel": "Sin producto elegido",
          "id": "d07-01"
        }
      ]
    },
    {
      "day": 8,
      "date": "2026-12-08",
      "unlockAt": "2026-12-08T00:00:00-05:00",
      "title": "Nessa en nuestro árbol",
      "description": "Posible esfera navideña personalizada de Nessa. Referencia TikTok pendiente.",
      "planningStatus": "TENTATIVO",
      "publicationStatus": "BORRADOR",
      "availabilityStatus": "PROGRAMADO",
      "experienceType": "REGALO_FISICO",
      "minigameType": "none",
      "animation": "soft-reveal",
      "transition": "fade",
      "audioBehavior": "inherit",
      "editorNotes": "",
      "mediaPending": [
        "referencia TikTok",
        "foto o diseño"
      ],
      "blocks": [
        {
          "type": "physical",
          "title": "Una esfera de nuestra Nessita",
          "body": "Idea tentativa; referencia pendiente.",
          "image": "",
          "audio": "",
          "video": "",
          "requires": "",
          "transition": "fade",
          "effect": "soft",
          "audioBehavior": "inherit",
          "item": "Esfera navideña personalizada de Nessa",
          "mediaLabel": "Foto o referencia pendiente",
          "id": "d08-01"
        }
      ]
    },
    {
      "day": 9,
      "date": "2026-12-09",
      "unlockAt": "2026-12-09T00:00:00-05:00",
      "title": "Una flor pequeñita",
      "description": "Aretes de flor de aproximadamente 1 cm; selección pendiente.",
      "planningStatus": "PROPUESTA",
      "publicationStatus": "BORRADOR",
      "availabilityStatus": "PROGRAMADO",
      "experienceType": "REGALO_FISICO",
      "minigameType": "none",
      "animation": "soft-reveal",
      "transition": "fade",
      "audioBehavior": "inherit",
      "editorNotes": "",
      "mediaPending": [
        "aretes por elegir"
      ],
      "blocks": [
        {
          "type": "physical",
          "title": "Una florecita para ti",
          "body": "Tamaño máximo aproximado: 1 cm. Producto pendiente.",
          "image": "",
          "audio": "",
          "video": "",
          "requires": "",
          "transition": "fade",
          "effect": "soft",
          "audioBehavior": "inherit",
          "item": "Aretes pequeños con forma de flor",
          "mediaLabel": "Producto por elegir",
          "id": "d09-01"
        }
      ]
    },
    {
      "day": 10,
      "date": "2026-12-10",
      "unlockAt": "2026-12-10T00:00:00-05:00",
      "title": "Raspa: un desayuno para dos",
      "description": "Raspadita que revela un vale para desayunar en Cafétos: Iced Mocha Latte y Sándwich de Pavo.",
      "planningStatus": "DEFINIDO",
      "publicationStatus": "BORRADOR",
      "availabilityStatus": "PROGRAMADO",
      "experienceType": "SCRATCH_VALE",
      "minigameType": "scratch",
      "animation": "soft-reveal",
      "transition": "fade",
      "audioBehavior": "inherit",
      "editorNotes": "",
      "mediaPending": [],
      "blocks": [
        {
          "type": "scratch",
          "title": "Un desayuno escondido",
          "body": "",
          "image": "",
          "audio": "",
          "video": "",
          "requires": "",
          "transition": "fade",
          "effect": "soft",
          "audioBehavior": "inherit",
          "message": "¡Nos espera un desayuno juntos en Cafétos!",
          "threshold": 0.4,
          "coverText": "Raspa nuestro secreto",
          "id": "d10-01"
        },
        {
          "type": "voucher",
          "title": "Desayuno en Cafétos",
          "body": "Iced Mocha Latte y Sándwich de Pavo para disfrutar juntos.",
          "image": "",
          "audio": "",
          "video": "",
          "requires": "d10-01",
          "transition": "fade",
          "effect": "soft",
          "audioBehavior": "inherit",
          "place": "Cafétos",
          "conditions": "Canjeable de común acuerdo.",
          "redeemable": true,
          "id": "d10-02"
        }
      ]
    },
    {
      "day": 11,
      "date": "2026-12-11",
      "unlockAt": "2026-12-11T00:00:00-05:00",
      "title": "Un poquito de travesura",
      "description": "Posible cuchillo retráctil de juguete para una broma. Idea sin aprobar.",
      "planningStatus": "TENTATIVO",
      "publicationStatus": "BORRADOR",
      "availabilityStatus": "PROGRAMADO",
      "experienceType": "REGALO_FISICO",
      "minigameType": "none",
      "animation": "soft-reveal",
      "transition": "fade",
      "audioBehavior": "inherit",
      "editorNotes": "",
      "mediaPending": [
        "regalo por confirmar",
        "notita"
      ],
      "blocks": [
        {
          "type": "physical",
          "title": "Una broma inocente",
          "body": "Juguete de broma; compra pendiente.",
          "image": "",
          "audio": "",
          "video": "",
          "requires": "",
          "transition": "fade",
          "effect": "soft",
          "audioBehavior": "inherit",
          "item": "Cuchillo retráctil de juguete",
          "id": "d11-01"
        },
        {
          "type": "letter",
          "title": "Una notita traviesa",
          "body": "",
          "image": "",
          "audio": "",
          "video": "",
          "requires": "",
          "transition": "fade",
          "effect": "soft",
          "audioBehavior": "inherit",
          "id": "d11-02"
        }
      ]
    },
    {
      "day": 12,
      "date": "2026-12-12",
      "unlockAt": "2026-12-12T00:00:00-05:00",
      "title": "Juntitos hasta en los pies",
      "description": "Medias de pareja con imanes. Posible regalo físico con una notita divertida.",
      "planningStatus": "TENTATIVO",
      "publicationStatus": "BORRADOR",
      "availabilityStatus": "PROGRAMADO",
      "experienceType": "REGALO_FISICO",
      "minigameType": "none",
      "animation": "soft-reveal",
      "transition": "fade",
      "audioBehavior": "inherit",
      "editorNotes": "",
      "mediaPending": [
        "medias por confirmar",
        "notita"
      ],
      "blocks": [
        {
          "type": "physical",
          "title": "Medias para ir juntitos",
          "body": "Idea tentativa.",
          "image": "",
          "audio": "",
          "video": "",
          "requires": "",
          "transition": "fade",
          "effect": "soft",
          "audioBehavior": "inherit",
          "item": "Medias de pareja con imanes",
          "id": "d12-01"
        },
        {
          "type": "letter",
          "title": "Hasta los calcetines se quieren",
          "body": "",
          "image": "",
          "audio": "",
          "video": "",
          "requires": "",
          "transition": "fade",
          "effect": "soft",
          "audioBehavior": "inherit",
          "id": "d12-02"
        }
      ]
    },
    {
      "day": 13,
      "date": "2026-12-13",
      "unlockAt": "2026-12-13T00:00:00-05:00",
      "title": "Una sorpresa con búhos",
      "description": "Regalo relacionado con búhos; sin objeto escogido.",
      "planningStatus": "PROPUESTA",
      "publicationStatus": "BORRADOR",
      "availabilityStatus": "PROGRAMADO",
      "experienceType": "REGALO_FISICO",
      "minigameType": "none",
      "animation": "soft-reveal",
      "transition": "fade",
      "audioBehavior": "inherit",
      "editorNotes": "",
      "mediaPending": [
        "objeto por elegir"
      ],
      "blocks": [
        {
          "type": "physical",
          "title": "Algo de tus búhos favoritos",
          "body": "Pendiente de decidir. No se ha elegido un producto.",
          "image": "",
          "audio": "",
          "video": "",
          "requires": "",
          "transition": "fade",
          "effect": "soft",
          "audioBehavior": "inherit",
          "item": "",
          "id": "d13-01"
        }
      ]
    },
    {
      "day": 14,
      "date": "2026-12-14",
      "unlockAt": "2026-12-14T00:00:00-05:00",
      "title": "Un abrazo de Burbuja",
      "description": "Posible peluche de Burbuja, Las Chicas Superpoderosas; no confirmado.",
      "planningStatus": "PROPUESTA",
      "publicationStatus": "BORRADOR",
      "availabilityStatus": "PROGRAMADO",
      "experienceType": "REGALO_FISICO",
      "minigameType": "none",
      "animation": "soft-reveal",
      "transition": "fade",
      "audioBehavior": "inherit",
      "editorNotes": "",
      "mediaPending": [
        "regalo pendiente"
      ],
      "blocks": [
        {
          "type": "physical",
          "title": "Una superheroína tierna",
          "body": "Idea provisional; aún no comprado.",
          "image": "",
          "audio": "",
          "video": "",
          "requires": "",
          "transition": "fade",
          "effect": "soft",
          "audioBehavior": "inherit",
          "item": "Posible peluche de Burbuja",
          "id": "d14-01"
        }
      ]
    },
    {
      "day": 15,
      "date": "2026-12-15",
      "unlockAt": "2026-12-15T00:00:00-05:00",
      "title": "El primer cumpleaños de nuestra Nessita 🐈❤️",
      "description": "Presentación del primer cumpleaños de Nessa, carta escrita desde su voz e ilustración con su mami en estética de pintura impresionista.",
      "planningStatus": "DEFINIDO",
      "publicationStatus": "BORRADOR",
      "availabilityStatus": "PROGRAMADO",
      "experienceType": "CUMPLE_NESSA",
      "minigameType": "none",
      "animation": "soft-reveal",
      "transition": "fade",
      "audioBehavior": "inherit",
      "editorNotes": "",
      "mediaPending": [
        "carta de Nessa",
        "ilustración personalizada"
      ],
      "blocks": [
        {
          "type": "intro",
          "title": "¡Feliz primer cumpleaños, Nessita!",
          "body": "Hoy celebramos a nuestra pequeña Nessa.",
          "image": "",
          "audio": "",
          "video": "",
          "requires": "",
          "transition": "fade",
          "effect": "soft",
          "audioBehavior": "inherit",
          "id": "d15-01"
        },
        {
          "type": "letter",
          "title": "Una cartita de Nessa para su mami",
          "body": "",
          "image": "",
          "audio": "",
          "video": "",
          "requires": "",
          "transition": "fade",
          "effect": "soft",
          "audioBehavior": "inherit",
          "narrator": "Nessa",
          "mediaLabel": "Carta desde la voz de Nessa pendiente",
          "id": "d15-02"
        },
        {
          "type": "image",
          "title": "Nessa con su mami",
          "body": "Ilustración original de Nessa con su mami, inspirada en pinceladas de Claude Monet.",
          "image": "",
          "audio": "",
          "video": "",
          "requires": "",
          "transition": "fade",
          "effect": "soft",
          "audioBehavior": "inherit",
          "mediaLabel": "Ilustración original pendiente",
          "id": "d15-03"
        }
      ]
    },
    {
      "day": 16,
      "date": "2026-12-16",
      "unlockAt": "2026-12-16T00:00:00-05:00",
      "title": "Arma nuestra siguiente aventura",
      "description": "Rompecabezas de la portada de Avengers: Doomsday; al completarlo se revelan las entradas ya compradas.",
      "planningStatus": "DEFINIDO",
      "publicationStatus": "BORRADOR",
      "availabilityStatus": "PROGRAMADO",
      "experienceType": "PUZZLE_CINE",
      "minigameType": "puzzle",
      "animation": "soft-reveal",
      "transition": "fade",
      "audioBehavior": "inherit",
      "editorNotes": "",
      "mediaPending": [
        "portada autorizada",
        "entradas reales"
      ],
      "blocks": [
        {
          "type": "puzzle",
          "title": "Reconstruye la película",
          "body": "",
          "image": "",
          "audio": "",
          "video": "",
          "requires": "",
          "transition": "fade",
          "effect": "soft",
          "audioBehavior": "inherit",
          "pieces": 9,
          "mediaLabel": "Portada autorizada pendiente",
          "id": "d16-01"
        },
        {
          "type": "tickets",
          "title": "¡Nos vamos al cine!",
          "body": "Entradas ya compradas para Avengers: Doomsday el 16 de diciembre.",
          "image": "",
          "audio": "",
          "video": "",
          "requires": "d16-01",
          "transition": "fade",
          "effect": "soft",
          "audioBehavior": "inherit",
          "date": "2026-12-16",
          "status": "ENTRADAS_COMPRADAS",
          "mediaLabel": "Entradas reales pendientes de adjuntar",
          "id": "d16-02"
        }
      ]
    },
    {
      "day": 17,
      "date": "2026-12-17",
      "unlockAt": "2026-12-17T00:00:00-05:00",
      "title": "Un abracito azul",
      "description": "Posible chompa de lana azul o azul marino. Pendiente de elegir.",
      "planningStatus": "PROPUESTA",
      "publicationStatus": "BORRADOR",
      "availabilityStatus": "PROGRAMADO",
      "experienceType": "REGALO_FISICO",
      "minigameType": "none",
      "animation": "soft-reveal",
      "transition": "fade",
      "audioBehavior": "inherit",
      "editorNotes": "",
      "mediaPending": [
        "prenda por elegir"
      ],
      "blocks": [
        {
          "type": "physical",
          "title": "Una chompa azul",
          "body": "Aún no elegida.",
          "image": "",
          "audio": "",
          "video": "",
          "requires": "",
          "transition": "fade",
          "effect": "soft",
          "audioBehavior": "inherit",
          "item": "Chompa de lana azul o azul marino",
          "id": "d17-01"
        }
      ]
    },
    {
      "day": 18,
      "date": "2026-12-18",
      "unlockAt": "2026-12-18T00:00:00-05:00",
      "title": "Tazas para dos en Navidad",
      "description": "Tazas navideñas de pareja, idealmente con diseño de galletas de jengibre.",
      "planningStatus": "DEFINIDO",
      "publicationStatus": "BORRADOR",
      "availabilityStatus": "PROGRAMADO",
      "experienceType": "REGALO_FISICO",
      "minigameType": "none",
      "animation": "soft-reveal",
      "transition": "fade",
      "audioBehavior": "inherit",
      "editorNotes": "",
      "mediaPending": [
        "foto del regalo"
      ],
      "blocks": [
        {
          "type": "physical",
          "title": "Nuestros chocolatitos navideños",
          "body": "Preferencia: diseños de galletas de jengibre.",
          "image": "",
          "audio": "",
          "video": "",
          "requires": "",
          "transition": "fade",
          "effect": "soft",
          "audioBehavior": "inherit",
          "item": "Tazas navideñas para pareja",
          "mediaLabel": "Foto del regalo pendiente",
          "id": "d18-01"
        }
      ]
    },
    {
      "day": 19,
      "date": "2026-12-19",
      "unlockAt": "2026-12-19T00:00:00-05:00",
      "title": "Una noche de luces navideñas",
      "description": "Vale romántico para salir juntos a disfrutar las luces y decoraciones navideñas.",
      "planningStatus": "DEFINIDO",
      "publicationStatus": "BORRADOR",
      "availabilityStatus": "PROGRAMADO",
      "experienceType": "VALE_EXPERIENCIA",
      "minigameType": "none",
      "animation": "soft-reveal",
      "transition": "fade",
      "audioBehavior": "inherit",
      "editorNotes": "",
      "mediaPending": [],
      "blocks": [
        {
          "type": "voucher",
          "title": "Una cita entre luces navideñas",
          "body": "Vale para salir juntos a disfrutar luces y decoraciones de Navidad.",
          "image": "",
          "audio": "",
          "video": "",
          "requires": "",
          "transition": "fade",
          "effect": "soft",
          "audioBehavior": "inherit",
          "conditions": "Fecha por acordar juntos.",
          "redeemable": true,
          "id": "d19-01"
        }
      ]
    },
    {
      "day": 20,
      "date": "2026-12-20",
      "unlockAt": "2026-12-20T00:00:00-05:00",
      "title": "El osito, la pollita y Nessa",
      "description": "Historia navideña ilustrada con introducción y cuatro viñetas. Su música reemplaza temporalmente el ambiente global y se restaura al salir.",
      "planningStatus": "DEFINIDO",
      "publicationStatus": "BORRADOR",
      "availabilityStatus": "PROGRAMADO",
      "experienceType": "HISTORIA_ILUSTRADA",
      "minigameType": "none",
      "animation": "soft-reveal",
      "transition": "fade",
      "audioBehavior": "pause-ambient",
      "editorNotes": "",
      "mediaPending": [
        "4 ilustraciones coherentes",
        "música de la historia",
        "narración opcional"
      ],
      "blocks": [
        {
          "type": "story",
          "title": "Una historia nuestra",
          "body": "",
          "image": "",
          "audio": "",
          "video": "",
          "requires": "",
          "transition": "dissolve",
          "effect": "soft",
          "audioBehavior": "pause-ambient",
          "intro": "Había una vez, en una Navidad nevada…",
          "scenes": [
            {
              "id": "s1",
              "title": "El osito en la nieve",
              "description": "Un osito marroncito, fluffy, con lentes y ojos pequeños, está solo, abandonado, triste y tiene mucho frío.",
              "image": "",
              "narration": ""
            },
            {
              "id": "s2",
              "title": "Una pollita se acerca",
              "description": "Una pollita pequeña, fluffy, de ojos grandes y mejillas sonrojadas, coloca su alita en la espalda del osito para animarlo.",
              "image": "",
              "narration": ""
            },
            {
              "id": "s3",
              "title": "Un encuentro con Nessa",
              "description": "Caminan de la mano y encuentran a Nessa, triste y con lágrimas, abandonada en una caja de zapatos en la calle.",
              "image": "",
              "narration": ""
            },
            {
              "id": "s4",
              "title": "Nuestro pequeño hogar",
              "description": "Bajo un árbol navideño, osito, pollita y Nessa gordita y fluffy se abrazan felices.",
              "image": "",
              "narration": ""
            }
          ],
          "music": "",
          "mediaLabel": "Faltan las cuatro ilustraciones y música autorizada",
          "id": "d20-01"
        }
      ]
    },
    {
      "day": 21,
      "date": "2026-12-21",
      "unlockAt": "2026-12-21T00:00:00-05:00",
      "title": "Un honguito acogedor",
      "description": "Posible quemador de vela de cerámica en forma de honguito rojo o naranja.",
      "planningStatus": "PROPUESTA",
      "publicationStatus": "BORRADOR",
      "availabilityStatus": "PROGRAMADO",
      "experienceType": "REGALO_FISICO",
      "minigameType": "none",
      "animation": "soft-reveal",
      "transition": "fade",
      "audioBehavior": "inherit",
      "editorNotes": "",
      "mediaPending": [
        "regalo por confirmar"
      ],
      "blocks": [
        {
          "type": "physical",
          "title": "Un honguito de cerámica",
          "body": "Color rojo o naranja; sin comprar.",
          "image": "",
          "audio": "",
          "video": "",
          "requires": "",
          "transition": "fade",
          "effect": "soft",
          "audioBehavior": "inherit",
          "item": "Quemador de vela en forma de honguito",
          "id": "d21-01"
        }
      ]
    },
    {
      "day": 22,
      "date": "2026-12-22",
      "unlockAt": "2026-12-22T00:00:00-05:00",
      "title": "Una casita de sorpresas",
      "description": "Calendario Casita de TODOMODA entregado como un solo regalo: peluche Osito, libreta y vaso Osito.",
      "planningStatus": "DEFINIDO",
      "publicationStatus": "BORRADOR",
      "availabilityStatus": "PROGRAMADO",
      "experienceType": "REGALO_FISICO",
      "minigameType": "none",
      "animation": "soft-reveal",
      "transition": "fade",
      "audioBehavior": "inherit",
      "editorNotes": "",
      "mediaPending": [
        "foto del calendario completo"
      ],
      "blocks": [
        {
          "type": "physical",
          "title": "Calendario Casita de TODOMODA",
          "body": "Un solo regalo que contiene: Peluche Osito, Libreta y Vaso Osito.",
          "image": "",
          "audio": "",
          "video": "",
          "requires": "",
          "transition": "fade",
          "effect": "soft",
          "audioBehavior": "inherit",
          "item": "Calendario de Adviento Casita de TODOMODA",
          "mediaLabel": "Foto del regalo completo pendiente",
          "id": "d22-01"
        }
      ]
    },
    {
      "day": 23,
      "date": "2026-12-23",
      "unlockAt": "2026-12-23T00:00:00-05:00",
      "title": "Un miniálbum de nosotros",
      "description": "Posible miniálbum de recuerdos y fotografías especiales; aún sin definir.",
      "planningStatus": "PROPUESTA",
      "publicationStatus": "BORRADOR",
      "availabilityStatus": "PROGRAMADO",
      "experienceType": "ALBUM_PENDIENTE",
      "minigameType": "none",
      "animation": "soft-reveal",
      "transition": "fade",
      "audioBehavior": "inherit",
      "editorNotes": "",
      "mediaPending": [
        "fotografías",
        "formato"
      ],
      "blocks": [
        {
          "type": "gallery",
          "title": "Un álbum chiquito con grandes recuerdos",
          "body": "Faltan por seleccionar fotografías, diseño y formato.",
          "image": "",
          "audio": "",
          "video": "",
          "requires": "",
          "transition": "fade",
          "effect": "soft",
          "audioBehavior": "inherit",
          "images": [],
          "id": "d23-01"
        }
      ]
    },
    {
      "day": 24,
      "date": "2026-12-24",
      "unlockAt": "2026-12-24T00:00:00-05:00",
      "title": "Un video con Nessita ❤️",
      "description": "Video sorpresa real grabado por el emisor junto a Nessa. Debe poder reemplazarse sin modificar el resto del proyecto.",
      "planningStatus": "DEFINIDO",
      "publicationStatus": "BORRADOR",
      "availabilityStatus": "PROGRAMADO",
      "experienceType": "VIDEO_PERSONAL",
      "minigameType": "none",
      "animation": "soft-reveal",
      "transition": "fade",
      "audioBehavior": "inherit",
      "editorNotes": "",
      "mediaPending": [
        "video personal auténtico"
      ],
      "blocks": [
        {
          "type": "video",
          "title": "Un mensaje muy especial de nosotros",
          "body": "Video grabado por el emisor junto a Nessa. Pendiente de grabación y edición.",
          "image": "",
          "audio": "",
          "video": "",
          "requires": "",
          "transition": "soft-reveal",
          "effect": "soft",
          "audioBehavior": "inherit",
          "mediaLabel": "Video personal pendiente de grabación",
          "id": "d24-01"
        }
      ]
    },
    {
      "day": 25,
      "date": "2026-12-25",
      "unlockAt": "2026-12-25T00:00:00-05:00",
      "title": "Una última sorpresa para mi pollita 🎁",
      "description": "Posible collar de plata u oro de TODOMODA, preferiblemente con gema azul marino; regalo no comprado ni aprobado.",
      "planningStatus": "TENTATIVO",
      "publicationStatus": "BORRADOR",
      "availabilityStatus": "PROGRAMADO",
      "experienceType": "GRAN_FINAL",
      "minigameType": "none",
      "animation": "soft-reveal",
      "transition": "fade",
      "audioBehavior": "inherit",
      "editorNotes": "",
      "mediaPending": [
        "collar por confirmar",
        "fotografía del regalo real"
      ],
      "blocks": [
        {
          "type": "intro",
          "title": "Nuestro último regalo de Navidad",
          "body": "Una última sorpresa preparada con muchísimo amor.",
          "image": "",
          "audio": "",
          "video": "",
          "requires": "",
          "transition": "fade",
          "effect": "soft",
          "audioBehavior": "inherit",
          "id": "d25-01"
        },
        {
          "type": "physical",
          "title": "Un detalle para siempre",
          "body": "Regalo tentativo, pendiente de decisión y compra. La presentación puede cambiar por completo.",
          "image": "",
          "audio": "",
          "video": "",
          "requires": "",
          "transition": "fade",
          "effect": "soft",
          "audioBehavior": "inherit",
          "item": "Posible collar TODOMODA de plata u oro con gema azul marino",
          "mediaLabel": "Regalo definitivo por confirmar",
          "id": "d25-02"
        }
      ]
    }
  ]
};
