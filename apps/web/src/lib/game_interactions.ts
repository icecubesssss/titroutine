export interface InteractionFeedback {
  canProceed: boolean;
  message: string;
}

/**
 * Trả về phản hồi bằng văn bản tương ứng với hành động cho ăn.
 * Ngăn chặn hành động spam khi thỏ cưng đã quá no.
 */
export function getFeedFeedback(foodId: string, currentSatiety: number): InteractionFeedback {
  if (currentSatiety >= 95) {
    return {
      canProceed: false,
      message: "Hông ăn nổi nữa đâu, bụng tớ sắp tròn xoe như quả bóng rồi nè! 🤰"
    };
  }

  let foodName = "đồ ăn";
  if (foodId === "carrot") foodName = "Cà rốt tươi ngon 🥕";
  if (foodId === "cake") foodName = "Bánh ngọt ngọt béo 🍰";
  if (foodId === "feast") foodName = "Đại tiệc thịnh soạn 🍲";

  return {
    canProceed: true,
    message: `Oa! Cảm ơn bạn nhiều nha, món ${foodName} này tuyệt ngon luôn! 😋💕`
  };
}

/**
 * Trả về phản hồi cho việc chơi đùa.
 * Ngăn chặn chơi đùa khi thỏ quá đói lả.
 */
export function getPlayFeedback(toyId: string, currentSatiety: number): InteractionFeedback {
  if (currentSatiety < 15) {
    return {
      canProceed: false,
      message: "Tớ đói lả người rồi, không còn sức chơi nữa... Hãy cho tớ ăn trước nhé! 😿"
    };
  }

  let toyName = "đồ chơi";
  if (toyId === "toy_ball") toyName = "Quả bóng cao su ⚽";
  if (toyId === "toy_bear") toyName = "Bạn gấu bông ấm áp 🧸";

  return {
    canProceed: true,
    message: `A ha! ${toyName} lăn kìa! Vui quá đi mất, cùng chạy nhảy nào! 🏃‍♂️💨`
  };
}

/**
 * Trả về phản hồi cho tắm rửa.
 * Ngăn chặn tắm rửa nếu đã sạch sẽ (Affection đầy đủ hoặc đơn giản là chống click spam liên tục).
 */
export function getCleanFeedback(lastInteractAt: string | null): InteractionFeedback {
  if (lastInteractAt) {
    const elapsed = Date.now() - new Date(lastInteractAt).getTime();
    if (elapsed < 15000) { // Cooldown 15 giây chống spam tắm liên tiếp
      return {
        canProceed: false,
        message: "Tớ sạch bong kin kít rồi, tắm nữa là trôi hết lông mượt mất tiêu! 🧼"
      };
    }
  }

  return {
    canProceed: true,
    message: "Bọt xà phòng thơm phức! Lại còn có cả chú vịt vàng cao su bơi cùng nữa! 🚿🛁"
  };
}

/**
 * Trả về phản hồi cho trạng thái ngủ.
 */
export function getSleepFeedback(hour: number): InteractionFeedback {
  if (hour >= 6 && hour < 22) {
    return {
      canProceed: false,
      message: "Tớ chưa buồn ngủ đâu, ban ngày tớ muốn cùng bạn học tập và rèn luyện thói quen cơ! ☀️"
    };
  }

  return {
    canProceed: true,
    message: "Oáp... Cơn buồn ngủ kéo đến rồi. Chúc chủ nhân ngủ ngon và có giấc mơ đẹp nhé! 🌙💤"
  };
}
