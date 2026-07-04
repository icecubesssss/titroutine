export interface AdventureChoice {
  text: string;
  trait: "curiosity" | "compassion" | "resilience" | "energy";
  value: number;
  like?: string;
  dislike?: string;
}

export interface AdventureStory {
  id: string;
  location: string;
  storyText: string;
  choiceA: AdventureChoice;
  choiceB: AdventureChoice;
}

export const ADVENTURE_STORIES: AdventureStory[] = [
  {
    id: "story_sprout",
    location: "Vườn Thông Cozy 🌲",
    storyText: "Tớ tìm thấy một hạt mầm nhỏ đang cố nứt ra giữa khe đá cằn cỗi trên sườn đồi. Tớ có nên đem hạt mầm về trồng trong chậu không nhỉ?",
    choiceA: {
      text: "Đem về chăm sóc nhé, bé cần tình yêu thương! 🌱",
      trait: "compassion",
      value: 3,
      like: "Chăm sóc cây cảnh 🌱"
    },
    choiceB: {
      text: "Hãy để hạt mầm tự chiến đấu với sỏi đá, nó sẽ mạnh mẽ hơn! ⛰️",
      trait: "resilience",
      value: 3,
      like: "Phiêu lưu leo núi ⛰️"
    }
  },
  {
    id: "story_butterfly",
    location: "Đồi Hoa Cúc 🌼",
    storyText: "Tớ gặp một bạn bướm xanh đang bay vòng quanh vì lạc đường. Tớ đã chỉ cho bạn ấy hướng bay về thung lũng đầy mật hoa cúc thơm phức.",
    choiceA: {
      text: "Cảm ơn cậu đã giúp đỡ bạn ấy thật dịu dàng! 🦋",
      trait: "compassion",
      value: 3,
      like: "Giúp đỡ bạn bè 🤝"
    },
    choiceB: {
      text: "Nhưng tại sao bạn ấy lại lạc đường nhỉ? Chắc do say sưa ngắm cảnh quá chăng?",
      trait: "curiosity",
      value: 3,
      like: "Ngắm hoa cúc vàng 🌼"
    }
  },
  {
    id: "story_rain",
    location: "Hồ Sen Yên Bình 🪷",
    storyText: "Cơn mưa rào bất chợt đổ xuống khi tớ chưa tìm được chỗ trú. Tớ đã dùng một chiếc lá sen to để che đầu và ngồi nghe tiếng mưa rơi rào rào trên mặt hồ.",
    choiceA: {
      text: "Tận hưởng tiếng mưa rơi thật là lãng mạn đúng không? 🌧️",
      trait: "resilience",
      value: 3,
      like: "Nghe tiếng mưa rơi 🌧️"
    },
    choiceB: {
      text: "Lần sau nhớ xem dự báo thời tiết trước khi đi kẻo ướt lông nha! ☔",
      trait: "energy",
      value: 3,
      dislike: "Bị ướt mưa ☔"
    }
  },
  {
    id: "story_cafe",
    location: "Phố Cafe Ấm Áp ☕",
    storyText: "Tớ ngửi thấy hương vị thơm lừng tỏa ra từ quán cà phê bên đường. Bạn nhân viên đã tặng tớ một cốc Trà sữa Matcha nóng hổi nhưng vị có chút đắng đắng...",
    choiceA: {
      text: "Uống trà sữa Matcha ấm sẽ giúp tinh thần cậu sảng khoái! 🍵",
      trait: "energy",
      value: 3,
      like: "Trà sữa Matcha 🍵"
    },
    choiceB: {
      text: "Vị đắng đó khó uống lắm đúng không? Có thể bạn nhân viên bỏ hơi ít sữa chăng?",
      trait: "curiosity",
      value: 3,
      dislike: "Vị đắng khó chịu 🤮"
    }
  },
  {
    id: "story_star",
    location: "Đỉnh Núi Ngắm Sao 🌌",
    storyText: "Tớ leo lên đỉnh đồi và nhìn thấy một ngôi sao băng vụt sáng qua bầu trời đêm. Tớ tự hỏi không biết sao băng có rơi trúng một kho báu bí mật nào đó dưới rừng không.",
    choiceA: {
      text: "Có thể lắm! Hôm sau chúng ta hãy thử đi tìm kho báu sao băng nhé! 🗺️",
      trait: "curiosity",
      value: 3,
      like: "Tìm kho báu sao băng 🗺️"
    },
    choiceB: {
      text: "Sao băng chỉ là các khối đá vũ trụ bốc cháy thôi, nhưng nó mang lại điều ước đấy! 🌠",
      trait: "resilience",
      value: 3,
      like: "Ước nguyện dưới sao băng 🌠"
    }
  }
];

export function getRandomStory(excludeId?: string | null): AdventureStory {
  const candidates = excludeId
    ? ADVENTURE_STORIES.filter((s) => s.id !== excludeId)
    : ADVENTURE_STORIES;
  const index = Math.floor(Math.random() * candidates.length);
  return candidates[index] || ADVENTURE_STORIES[0];
}
