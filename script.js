document.addEventListener('DOMContentLoaded', () => {
    // Bước 4.1: Kích hoạt và tắt các ô input "Other"
    const otherCheckboxes = document.querySelectorAll('input[type="checkbox"][value="other"]');
    
    otherCheckboxes.forEach(checkbox => {
        checkbox.addEventListener('change', () => {
            const otherInput = checkbox.parentElement.querySelector('input[type="text"]');
            if (checkbox.checked) {
                otherInput.disabled = false;
                otherInput.focus(); // Tự động focus vào ô input
            } else {
                otherInput.disabled = true;
                otherInput.value = '';
            }
        });
    });

    // Bước 4.2: Thu thập dữ liệu từ form và lưu trữ vào các biến
    const form = document.getElementById('project-form');
    const resultDiv = document.getElementById('result');
    const copyBtn = document.getElementById('copy-btn');
    const refreshBtn = document.getElementById('refresh-btn');

    form.addEventListener('submit', async (event) => {
        event.preventDefault(); // Ngăn tải lại trang

        // Tạo object để lưu dữ liệu
        const data = {
            projectType: [],
            audience: [],
            goal: [],
            priorKnowledge: [],
            contentMedium: [],
            timeConstraint: [],
            interactionLevel: [],
            description: ''
        };

        // Thu thập dữ liệu từ form
        const formData = new FormData(form);

        // Lưu dữ liệu vào object
        formData.forEach((value, key) => {
            if (key === 'project-type') data.projectType.push(value);
            if (key === 'project-type-other' && value) data.projectType.push(value);
            if (key === 'audience') data.audience.push(value);
            if (key === 'audience-other' && value) data.audience.push(value);
            if (key === 'goal') data.goal.push(value);
            if (key === 'goal-other' && value) data.goal.push(value);
            if (key === 'prior-knowledge') data.priorKnowledge.push(value);
            if (key === 'content-medium') data.contentMedium.push(value);
            if (key === 'content-medium-other' && value) data.contentMedium.push(value);
            if (key === 'time-constraint') data.timeConstraint.push(value);
            if (key === 'time-constraint-other' && value) data.timeConstraint.push(value);
            if (key === 'interaction-level') data.interactionLevel.push(value);
            if (key === 'interaction-level-other' && value) data.interactionLevel.push(value);
            if (key === 'description') data.description = value;
        });

        // Kiểm tra tất cả các trường có dữ liệu không
        const requiredFields = [
            data.projectType,
            data.audience,
            data.goal,
            data.priorKnowledge,
            data.contentMedium,
            data.timeConstraint,
            data.interactionLevel,
            data.description
        ];

        let allFieldsFilled = true;
        for (let field of requiredFields) {
            if (Array.isArray(field) && field.length === 0) {
                allFieldsFilled = false;
                break;
            } else if (!field && field !== 0) {
                allFieldsFilled = false;
                break;
            }
        }

        // Nếu không đủ dữ liệu, hiển thị thông báo lỗi
        if (!allFieldsFilled) {
            resultDiv.innerHTML = '<p style="color: red;">Please fill in all 8 fields before submitting.</p>';
            return; // Dừng thực thi tiếp
        }

        // Hiển thị thông báo chờ trước khi gửi yêu cầu API
        resultDiv.innerHTML = '<p class="loading-text">Please wait! AI is generating your design principles...</p>';

        // Bước 4.3: Tích hợp dữ liệu từ biến vào prompt template
        const prompt = `You are an expert in Mayer's 12 Multimedia Design Principles. Based on the following project details, recommend the most relevant principles to optimize the multimedia design. Ensure recommendations are highly specific to the project context, with clear justifications explaining why each principle is applicable based on the provided details. Format the response in English, using a heading (## Recommended Principles) followed by bullet points (e.g., - Principle Name: Description). Do not use tables or any other formatting except headings and bullet points. Ensure the recommendations are concise, practical, and directly applicable to the project.

Project Details:
- Project Type: ${data.projectType.join(', ')}
- Target Audience: ${data.audience.join(', ')}
- Design Goal: ${data.goal.join(', ')}
- Prior Knowledge Level: ${data.priorKnowledge.join(', ')}
- Content Medium: ${data.contentMedium.join(', ')}
- Time Constraint: ${data.timeConstraint.join(', ')}
- Interaction Level: ${data.interactionLevel.join(', ')}
- Project Description: ${data.description.trim()}
`;

        // Bước 4.4: Gọi API của Groq
        try {
            const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': 'Bearer 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'
                },
                body: JSON.stringify({
                    model: 'llama-3.3-70b-versatile',
                    messages: [
                        {
                            role: 'user',
                            content: prompt
                        }
                    ],
                    temperature: 0.7
                })
            });

            if (!response.ok) {
                throw new Error(`API request failed with status ${response.status}`);
            }

            const data = await response.json();
            const result = data.choices[0].message.content;

            // Chuyển đổi Markdown thành HTML
            let formattedResult = '';
            const lines = result.split('\n').filter(line => line.trim() !== '');

            lines.forEach(line => {
                if (line.startsWith('## ')) {
                    const heading = line.replace('## ', '');
                    formattedResult += `<h2 class="recommendation-heading">${heading}</h2>`;
                } else if (line.startsWith('- ')) {
                    const content = line.replace('- ', '');
                    const [principle, description] = content.split(': ');
                    if (principle && description) {
                        formattedResult += `
                            <li class="recommendation-item">
                                <strong>${principle}:</strong> ${description}
                            </li>
                        `;
                    }
                }
            });

            // Hiển thị kết quả đã định dạng
            resultDiv.innerHTML = `
                <div class="recommendations">
                    ${formattedResult}
                </div>
            `;
            // Hiển thị cả hai nút Refresh và Copy Results khi có kết quả
            copyBtn.classList.remove('hidden');
            refreshBtn.classList.remove('hidden');
        } catch (error) {
            resultDiv.innerHTML = `<p style="color: red;">Error: ${error.message}. Please check your API Key or try again later.</p>`;
            console.error('API Error:', error);
        }
    });

    // Thêm sự kiện cho nút Copy Results
    copyBtn.addEventListener('click', async () => {
        try {
            // Lấy nội dung từ div recommendations
            const recommendations = document.querySelector('.recommendations');
            if (!recommendations) {
                alert('No results to copy.');
                return;
            }

            // Chuyển nội dung HTML thành text thuần
            let textToCopy = '';
            const heading = recommendations.querySelector('.recommendation-heading');
            const items = recommendations.querySelectorAll('.recommendation-item');

            if (heading) {
                textToCopy += `${heading.textContent}\n\n`;
            }
            items.forEach(item => {
                const principle = item.querySelector('strong').textContent;
                const description = item.textContent.replace(principle, '').trim();
                textToCopy += `- ${principle} ${description}\n`;
            });

            // Sử dụng Clipboard API để copy
            await navigator.clipboard.writeText(textToCopy);
            alert('Results copied to clipboard!');
        } catch (error) {
            console.error('Copy Error:', error);
            alert('Failed to copy results. Please try again.');
        }
    });

    // Bước 4.5: Thêm sự kiện cho nút Refresh
    refreshBtn.addEventListener('click', () => {
        window.scrollTo(0, 0); // Cuộn lên đầu trang
        location.reload(); // Tải lại trang
    });
});
