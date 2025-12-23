// AI助手功能
class AIAssistant {
    constructor() {
        this.apiKey = localStorage.getItem('deepseek_api_key') || '';
        this.chatHistory = [];
        this.isOpen = false;
        this.init();
    }

    init() {
        this.createAssistantUI();
        this.attachEventListeners();
        this.addCodeBlockButtons();
    }

    createAssistantUI() {
        const assistantHTML = `
            <!-- AI助手浮动按钮 -->
            <div id="ai-assistant-btn" class="ai-assistant-btn" title="AI助手">
                <i class="fas fa-robot"></i>
            </div>

            <!-- AI助手面板 -->
            <div id="ai-assistant-panel" class="ai-assistant-panel">
                <div class="ai-assistant-header">
                    <div class="ai-assistant-title">
                        <i class="fas fa-robot"></i>
                        <span>AI学习助手</span>
                    </div>
                    <div class="ai-assistant-actions">
                        <button id="ai-settings-btn" class="ai-icon-btn" title="设置API密钥">
                            <i class="fas fa-cog"></i>
                        </button>
                        <button id="ai-clear-btn" class="ai-icon-btn" title="清空对话">
                            <i class="fas fa-trash"></i>
                        </button>
                        <button id="ai-close-btn" class="ai-icon-btn" title="关闭">
                            <i class="fas fa-times"></i>
                        </button>
                    </div>
                </div>
                
                <div id="ai-chat-messages" class="ai-chat-messages">
                    <div class="ai-welcome-message">
                        <i class="fas fa-hand-sparkles"></i>
                        <p>你好！我是你的AI学习助手，可以帮你解答课程相关的问题。</p>
                        <p class="ai-hint">💡 提示：点击代码块右上角的按钮可以快速提问</p>
                    </div>
                </div>

                <div class="ai-input-area">
                    <textarea id="ai-input" placeholder="输入你的问题..." rows="2"></textarea>
                    <button id="ai-send-btn" class="ai-send-btn">
                        <i class="fas fa-paper-plane"></i>
                    </button>
                </div>
            </div>

            <!-- API设置模态框 -->
            <div id="ai-settings-modal" class="ai-modal">
                <div class="ai-modal-content">
                    <div class="ai-modal-header">
                        <h3><i class="fas fa-key"></i> DeepSeek API设置</h3>
                        <button class="ai-modal-close">&times;</button>
                    </div>
                    <div class="ai-modal-body">
                        <p>请输入你的DeepSeek API密钥：</p>
                        <input type="password" id="api-key-input" placeholder="sk-..." value="${this.apiKey}">
                        <p class="ai-hint">
                            <i class="fas fa-info-circle"></i> 
                            API密钥将安全地存储在浏览器本地，不会上传到服务器。
                            <br>获取API密钥：<a href="https://platform.deepseek.com" target="_blank">DeepSeek平台</a>
                        </p>
                    </div>
                    <div class="ai-modal-footer">
                        <button id="save-api-key-btn" class="ai-btn-primary">保存</button>
                        <button class="ai-btn-secondary ai-modal-close">取消</button>
                    </div>
                </div>
            </div>
        `;

        document.body.insertAdjacentHTML('beforeend', assistantHTML);
    }

    attachEventListeners() {
        // 打开/关闭助手
        document.getElementById('ai-assistant-btn').addEventListener('click', () => this.togglePanel());
        document.getElementById('ai-close-btn').addEventListener('click', () => this.togglePanel());

        // 发送消息
        document.getElementById('ai-send-btn').addEventListener('click', () => this.sendMessage());
        document.getElementById('ai-input').addEventListener('keydown', (e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                this.sendMessage();
            }
        });

        // 清空对话
        document.getElementById('ai-clear-btn').addEventListener('click', () => this.clearChat());

        // 设置API密钥
        document.getElementById('ai-settings-btn').addEventListener('click', () => this.openSettings());
        document.getElementById('save-api-key-btn').addEventListener('click', () => this.saveApiKey());

        // 模态框关闭
        document.querySelectorAll('.ai-modal-close').forEach(btn => {
            btn.addEventListener('click', () => this.closeSettings());
        });

        // 点击模态框外部关闭
        document.getElementById('ai-settings-modal').addEventListener('click', (e) => {
            if (e.target.id === 'ai-settings-modal') {
                this.closeSettings();
            }
        });
    }

    addCodeBlockButtons() {
        // 为所有代码块添加AI助手按钮
        document.querySelectorAll('pre code').forEach((codeBlock, index) => {
            const pre = codeBlock.parentElement;
            if (!pre.querySelector('.code-ai-btn')) {
                const btn = document.createElement('button');
                btn.className = 'code-ai-btn';
                btn.innerHTML = '<i class="fas fa-robot"></i> 询问AI';
                btn.title = '向AI助手提问关于这段代码';
                btn.addEventListener('click', () => {
                    const code = codeBlock.textContent;
                    this.askAboutCode(code);
                });
                pre.style.position = 'relative';
                pre.appendChild(btn);
            }
        });
    }

    togglePanel() {
        this.isOpen = !this.isOpen;
        const panel = document.getElementById('ai-assistant-panel');
        panel.classList.toggle('open', this.isOpen);
        
        if (this.isOpen && !this.apiKey) {
            setTimeout(() => this.openSettings(), 300);
        }
    }

    openSettings() {
        document.getElementById('ai-settings-modal').style.display = 'flex';
    }

    closeSettings() {
        document.getElementById('ai-settings-modal').style.display = 'none';
    }

    saveApiKey() {
        const apiKey = document.getElementById('api-key-input').value.trim();
        if (apiKey) {
            this.apiKey = apiKey;
            localStorage.setItem('deepseek_api_key', apiKey);
            this.closeSettings();
            this.addMessage('system', 'API密钥已保存！现在可以开始提问了。');
        } else {
            alert('请输入有效的API密钥');
        }
    }

    clearChat() {
        if (confirm('确定要清空所有对话记录吗？')) {
            this.chatHistory = [];
            const messagesDiv = document.getElementById('ai-chat-messages');
            messagesDiv.innerHTML = `
                <div class="ai-welcome-message">
                    <i class="fas fa-hand-sparkles"></i>
                    <p>对话已清空，可以开始新的提问。</p>
                </div>
            `;
        }
    }

    async sendMessage() {
        const input = document.getElementById('ai-input');
        const message = input.value.trim();
        
        if (!message) return;
        
        if (!this.apiKey) {
            this.openSettings();
            return;
        }

        // 显示用户消息
        this.addMessage('user', message);
        input.value = '';
        input.style.height = 'auto';

        // 获取当前页面上下文
        const context = this.getPageContext();

        // 显示加载状态
        const loadingId = this.addMessage('assistant', '正在思考...', true);

        try {
            const response = await this.callDeepSeekAPI(message, context);
            this.removeMessage(loadingId);
            this.addMessage('assistant', response);
        } catch (error) {
            this.removeMessage(loadingId);
            this.addMessage('error', `错误: ${error.message}`);
        }
    }

    async askAboutCode(code) {
        if (!this.isOpen) {
            this.togglePanel();
        }

        const message = `请解释以下代码：\n\`\`\`\n${code}\n\`\`\``;
        document.getElementById('ai-input').value = message;
        
        // 自动发送
        setTimeout(() => this.sendMessage(), 300);
    }

    getPageContext() {
        // 获取整个HTML文档的文本内容作为上下文
        const htmlContent = document.documentElement.outerHTML;
        
        // 提取关键信息
        const title = document.querySelector('h1')?.textContent || document.title || '';
        
        // 提取所有section的标题和内容
        const sections = [];
        document.querySelectorAll('.homework-section').forEach(section => {
            const sectionTitle = section.querySelector('h2, h3')?.textContent || '';
            const sectionText = section.textContent.substring(0, 500); // 限制每个section的长度
            if (sectionTitle) {
                sections.push(`${sectionTitle}: ${sectionText}`);
            }
        });
        
        // 提取所有代码块
        const codeBlocks = [];
        document.querySelectorAll('pre code').forEach((code, index) => {
            const codeText = code.textContent.substring(0, 300);
            codeBlocks.push(`代码块${index + 1}: ${codeText}`);
        });
        
        // 提取问题描述
        const questions = [];
        document.querySelectorAll('.question-box, .homework-section h3').forEach(q => {
            const questionText = q.textContent.trim();
            if (questionText) {
                questions.push(questionText);
            }
        });
        
        // 构建完整上下文
        let context = `# 当前页面：${title}\n\n`;
        
        if (questions.length > 0) {
            context += `## 作业问题：\n${questions.slice(0, 5).join('\n')}\n\n`;
        }
        
        if (sections.length > 0) {
            context += `## 主要内容：\n${sections.slice(0, 8).join('\n\n')}\n\n`;
        }
        
        if (codeBlocks.length > 0) {
            context += `## 代码示例：\n${codeBlocks.slice(0, 3).join('\n\n')}\n\n`;
        }
        
        // 如果上下文太长，截断到合理长度（约4000字符）
        if (context.length > 4000) {
            context = context.substring(0, 4000) + '\n...(内容已截断)';
        }
        
        return context;
    }

    async callDeepSeekAPI(message, context) {
        const messages = [
            {
                role: 'system',
                content: `你是一个专业的AI课程学习助手，专门帮助学生理解"高级人工智能"课程的内容。

当前学习材料的完整内容如下：
${context}

你的任务：
1. 基于上述完整的课程内容回答学生的问题
2. 如果问题涉及代码，请结合上下文中的代码示例进行解释
3. 如果问题涉及算法或概念，请参考上下文中的详细说明
4. 用清晰、易懂的方式回答，必要时使用公式、代码示例或类比
5. 如果上下文中没有相关信息，请诚实地说明，并提供你的一般性知识

回答风格：
- 简洁明了，重点突出
- 使用markdown格式（代码块、加粗、列表等）
- 适当使用emoji增加可读性
- 如果是复杂概念，先给出简单解释，再深入细节`
            },
            ...this.chatHistory,
            {
                role: 'user',
                content: message
            }
        ];

        const response = await fetch('https://api.deepseek.com/v1/chat/completions', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${this.apiKey}`
            },
            body: JSON.stringify({
                model: 'deepseek-chat',
                messages: messages,
                temperature: 0.7,
                max_tokens: 2000
            })
        });

        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.error?.message || '请求失败');
        }

        const data = await response.json();
        const assistantMessage = data.choices[0].message.content;

        // 保存对话历史（限制长度）
        this.chatHistory.push(
            { role: 'user', content: message },
            { role: 'assistant', content: assistantMessage }
        );

        // 只保留最近10轮对话
        if (this.chatHistory.length > 20) {
            this.chatHistory = this.chatHistory.slice(-20);
        }

        return assistantMessage;
    }

    addMessage(role, content, isLoading = false) {
        const messagesDiv = document.getElementById('ai-chat-messages');
        const messageId = `msg-${Date.now()}`;
        
        const messageHTML = `
            <div class="ai-message ai-message-${role}" id="${messageId}">
                <div class="ai-message-avatar">
                    <i class="fas fa-${role === 'user' ? 'user' : role === 'error' ? 'exclamation-triangle' : 'robot'}"></i>
                </div>
                <div class="ai-message-content ${isLoading ? 'loading' : ''}">
                    ${this.formatMessage(content)}
                </div>
            </div>
        `;
        
        messagesDiv.insertAdjacentHTML('beforeend', messageHTML);
        messagesDiv.scrollTop = messagesDiv.scrollHeight;
        
        return messageId;
    }

    removeMessage(messageId) {
        const message = document.getElementById(messageId);
        if (message) {
            message.remove();
        }
    }

    formatMessage(content) {
        // 增强的markdown格式化
        let formatted = content;
        
        // 1. 代码块（必须先处理，避免被其他规则影响）
        const codeBlocks = [];
        formatted = formatted.replace(/```(\w+)?\n([\s\S]*?)```/g, (match, lang, code) => {
            const placeholder = `__CODE_BLOCK_${codeBlocks.length}__`;
            codeBlocks.push(`<pre><code class="language-${lang || 'text'}">${this.escapeHtml(code.trim())}</code></pre>`);
            return placeholder;
        });
        
        // 2. 行内代码
        const inlineCodes = [];
        formatted = formatted.replace(/`([^`]+)`/g, (match, code) => {
            const placeholder = `__INLINE_CODE_${inlineCodes.length}__`;
            inlineCodes.push(`<code>${this.escapeHtml(code)}</code>`);
            return placeholder;
        });
        
        // 3. 表格
        formatted = this.formatTable(formatted);
        
        // 4. 标题（必须在新行开始）
        formatted = formatted.replace(/^### (.*?)$/gm, '<h5>$1</h5>');
        formatted = formatted.replace(/^### (.*?)$/gm, '<h4>$1</h4>');
        formatted = formatted.replace(/^## (.*?)$/gm, '<h3>$1</h3>');
        formatted = formatted.replace(/^# (.*?)$/gm, '<h2>$1</h2>');
        
        // 5. 粗体和斜体
        formatted = formatted.replace(/\*\*\*(.+?)\*\*\*/g, '<strong><em>$1</em></strong>');
        formatted = formatted.replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>');
        formatted = formatted.replace(/\*(.+?)\*/g, '<em>$1</em>');
        
        // 6. 链接
        formatted = formatted.replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2" target="_blank">$1</a>');
        
        // 7. 列表（改进的处理）
        formatted = this.formatLists(formatted);
        
        // 8. 引用块
        formatted = formatted.replace(/^>\s+(.+)$/gm, '<blockquote>$1</blockquote>');
        
        // 9. 水平线
        formatted = formatted.replace(/^---+$/gm, '<hr>');
        formatted = formatted.replace(/^\*\*\*+$/gm, '<hr>');
        
        // 10. 换行处理
        formatted = formatted.split('\n\n').map(para => {
            if (para.match(/^<(h[234]|pre|ul|ol|blockquote|hr|table)/)) {
                return para;
            }
            return para ? `<p>${para.replace(/\n/g, '<br>')}</p>` : '';
        }).join('\n');
        
        // 11. 恢复代码块
        codeBlocks.forEach((code, i) => {
            formatted = formatted.replace(`__CODE_BLOCK_${i}__`, code);
        });
        
        // 12. 恢复行内代码
        inlineCodes.forEach((code, i) => {
            formatted = formatted.replace(`__INLINE_CODE_${i}__`, code);
        });
        
        // 13. 清理
        formatted = formatted.replace(/<p><\/p>/g, '');
        formatted = formatted.replace(/<p>\s*<\/p>/g, '');
        
        return formatted;
    }
    
    formatLists(content) {
        const lines = content.split('\n');
        const result = [];
        let inList = false;
        let listType = null; // 'ul' or 'ol'
        let listItems = [];
        
        for (let i = 0; i < lines.length; i++) {
            const line = lines[i];
            const unorderedMatch = line.match(/^\s*[-*+]\s+(.+)$/);
            const orderedMatch = line.match(/^\s*\d+\.\s+(.+)$/);
            
            if (unorderedMatch) {
                if (!inList || listType !== 'ul') {
                    if (inList) {
                        result.push(`<${listType}>${listItems.join('')}</${listType}>`);
                        listItems = [];
                    }
                    inList = true;
                    listType = 'ul';
                }
                listItems.push(`<li>${unorderedMatch[1]}</li>`);
            } else if (orderedMatch) {
                if (!inList || listType !== 'ol') {
                    if (inList) {
                        result.push(`<${listType}>${listItems.join('')}</${listType}>`);
                        listItems = [];
                    }
                    inList = true;
                    listType = 'ol';
                }
                listItems.push(`<li>${orderedMatch[1]}</li>`);
            } else {
                if (inList) {
                    result.push(`<${listType}>${listItems.join('')}</${listType}>`);
                    listItems = [];
                    inList = false;
                    listType = null;
                }
                result.push(line);
            }
        }
        
        // 处理最后的列表
        if (inList) {
            result.push(`<${listType}>${listItems.join('')}</${listType}>`);
        }
        
        return result.join('\n');
    }
    
    escapeHtml(text) {
        const map = {
            '&': '&amp;',
            '<': '&lt;',
            '>': '&gt;',
            '"': '&quot;',
            "'": '&#039;'
        };
        return text.replace(/[&<>"']/g, m => map[m]);
    }
    
    formatTable(content) {
        // 检测并格式化markdown表格
        const lines = content.split('\n');
        const result = [];
        let inTable = false;
        let tableRows = [];
        
        for (let i = 0; i < lines.length; i++) {
            const line = lines[i];
            
            if (line.trim().startsWith('|') && line.trim().endsWith('|')) {
                if (!inTable) {
                    inTable = true;
                    tableRows = [];
                }
                tableRows.push(line);
            } else {
                if (inTable) {
                    // 结束表格
                    result.push(this.buildTable(tableRows));
                    tableRows = [];
                    inTable = false;
                }
                result.push(line);
            }
        }
        
        // 处理最后的表格
        if (inTable) {
            result.push(this.buildTable(tableRows));
        }
        
        return result.join('\n');
    }
    
    buildTable(rows) {
        if (rows.length < 2) return rows.join('\n');
        
        // 检查第二行是否是分隔符
        const separatorRow = rows[1];
        if (!/^\|[\s:-]+\|/.test(separatorRow)) {
            return rows.join('\n');
        }
        
        let html = '<table class="ai-table">';
        
        // 处理表头
        const headerCells = rows[0].split('|').filter(cell => cell.trim());
        html += '<thead><tr>';
        headerCells.forEach(cell => {
            html += `<th>${cell.trim()}</th>`;
        });
        html += '</tr></thead>';
        
        // 处理表体
        html += '<tbody>';
        for (let i = 2; i < rows.length; i++) {
            const cells = rows[i].split('|').filter(cell => cell.trim());
            if (cells.length === 0) continue;
            
            html += '<tr>';
            cells.forEach(cell => {
                html += `<td>${cell.trim()}</td>`;
            });
            html += '</tr>';
        }
        html += '</tbody></table>';
        
        return html;
    }
}

// 页面加载完成后初始化AI助手
document.addEventListener('DOMContentLoaded', () => {
    window.aiAssistant = new AIAssistant();
});
