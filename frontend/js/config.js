/**
 * 配置管理相关功能
 */

// 全局配置数据
let configData = {
    reasoner_models: {},
    target_models: {},
    composite_models: {},
    proxy: {
        proxy_open: false,
        proxy_address: ""
    },
    system: {
        allow_origins: ["*"],
        log_level: "INFO",
        api_key: "123456",
        save_deepseek_tokens: false,
        save_deepseek_tokens_max_tokens: 5
    }
};

// 模态框和选项元素
const addModelModal = new bootstrap.Modal(document.getElementById('add-model-modal'));
const confirmDeleteModal = new bootstrap.Modal(document.getElementById('confirm-delete-modal'));
const importConfigModal = new bootstrap.Modal(document.getElementById('import-config-modal'));
const deleteModelNameSpan = document.getElementById('delete-model-name');
const confirmDeleteBtn = document.getElementById('confirm-delete-btn');
const addModelForm = document.getElementById('add-model-form');
const addModelFields = document.getElementById('add-model-fields');
const confirmAddModelBtn = document.getElementById('confirm-add-model');
const addModelTitle = document.getElementById('add-model-title');

// 导入导出相关元素
const exportConfigBtn = document.getElementById('export-config-btn');
const importConfigBtn = document.getElementById('import-config-btn');
const configFileInput = document.getElementById('config-file-input');
const configPreview = document.getElementById('config-preview');
const configPreviewContent = document.getElementById('config-preview-content');
const confirmImportBtn = document.getElementById('confirm-import-btn');

// 模型容器
const reasonerModelsContainer = document.getElementById('reasoner-models-container');
const targetModelsContainer = document.getElementById('target-models-container');
const compositeModelsContainer = document.getElementById('composite-models-container');

// 添加模型按钮
const addReasonerModelBtn = document.getElementById('add-reasoner-model-btn');
const addTargetModelBtn = document.getElementById('add-target-model-btn');
const addCompositeModelBtn = document.getElementById('add-composite-model-btn');

// 保存按钮
const saveAllBtn = document.getElementById('save-all-btn');
const saveProxyBtn = document.getElementById('save-proxy-btn');
const saveSystemBtn = document.getElementById('save-system-btn');

// 代理设置
const proxyOpenSwitch = document.getElementById('proxy-open');
const proxyAddressInput = document.getElementById('proxy-address');

// 系统设置
const allowOriginsContainer = document.getElementById('allow-origins-container');
const addOriginBtn = document.getElementById('add-origin-btn');
const logLevelSelect = document.getElementById('log-level');
const systemApiKeyInput = document.getElementById('system-api-key');

// 存储选择的配置文件内容
let selectedConfigData = null;

/**
 * 初始化配置管理
 */
function initConfig() {
    // 绑定添加模型按钮事件
    addReasonerModelBtn.addEventListener('click', () => showAddModelModal('reasoner'));
    addTargetModelBtn.addEventListener('click', () => showAddModelModal('target'));
    addCompositeModelBtn.addEventListener('click', () => showAddModelModal('composite'));
    
    // 绑定保存按钮事件
    saveAllBtn.addEventListener('click', saveAllConfigurations);
    saveProxyBtn.addEventListener('click', saveProxySettings);
    saveSystemBtn.addEventListener('click', saveSystemSettings);
    
    // 绑定导入导出按钮事件
    exportConfigBtn.addEventListener('click', exportConfiguration);
    importConfigBtn.addEventListener('click', () => importConfigModal.show());
    
    // 绑定文件选择和导入确认事件
    configFileInput.addEventListener('change', handleConfigFileSelect);
    confirmImportBtn.addEventListener('click', handleConfigImport);
    
    // 绑定添加源按钮事件
    addOriginBtn.addEventListener('click', addAllowOriginInput);
    
    // 绑定确认添加模型按钮事件
    confirmAddModelBtn.addEventListener('click', handleAddModel);
    
    // 绑定确认删除按钮事件
    confirmDeleteBtn.addEventListener('click', handleDeleteModel);
    
    // 初始化 Bootstrap 标签页
    document.querySelectorAll('.nav-link').forEach(link => {
        link.addEventListener('click', function(event) {
            event.preventDefault();
            document.querySelectorAll('.nav-link').forEach(l => l.classList.remove('active'));
            this.classList.add('active');
            
            const targetId = this.getAttribute('href').substring(1);
            document.querySelectorAll('.tab-pane').forEach(pane => {
                pane.classList.remove('show', 'active');
            });
            document.getElementById(targetId).classList.add('show', 'active');
        });
    });
}

/**
 * 加载配置数据
 */
async function loadConfigData() {
    try {
        showToast('正在加载配置数据...', 'info');
        
        const apiKey = Auth.getCurrentApiKey();
        const response = await fetch(`${Auth.API_BASE_URL}/v1/config`, {
            headers: {
                'Authorization': `Bearer ${apiKey}`
            }
        });
        
        if (!response.ok) {
            throw new Error('加载配置数据失败');
        }
        
        configData = await response.json();
        
        // 确保系统设置存在
        if (!configData.system) {
            configData.system = {
                allow_origins: ["*"],
                log_level: "INFO",
                api_key: "123456",
                save_deepseek_tokens: false,
                save_deepseek_tokens_max_tokens: 5
            };
        }
        
        // 确保系统设置中包含所有必需的字段
        if (!configData.system.hasOwnProperty('save_deepseek_tokens')) {
            configData.system.save_deepseek_tokens = false;
        }
        if (!configData.system.hasOwnProperty('save_deepseek_tokens_max_tokens')) {
            configData.system.save_deepseek_tokens_max_tokens = 5;
        }
        
        // 渲染模型
        renderModels();
        
        // 渲染代理设置
        renderProxySettings();
        
        // 渲染系统设置
        renderSystemSettings();
        
        showToast('配置数据加载成功', 'success');
    } catch (error) {
        console.error('加载配置数据时发生错误:', error);
        showToast('加载配置数据失败: ' + error.message, 'danger');
    }
}

/**
 * 渲染所有模型
 */
function renderModels() {
    // 清空容器
    reasonerModelsContainer.innerHTML = '';
    targetModelsContainer.innerHTML = '';
    compositeModelsContainer.innerHTML = '';
    
    // 渲染推理模型
    Object.entries(configData.reasoner_models || {}).forEach(([name, config]) => {
        renderReasonerModel(name, config);
    });
    
    // 渲染目标模型
    Object.entries(configData.target_models || {}).forEach(([name, config]) => {
        renderTargetModel(name, config);
    });
    
    // 渲染组合模型
    Object.entries(configData.composite_models || {}).forEach(([name, config]) => {
        renderCompositeModel(name, config);
    });
}

/**
 * 渲染推理模型
 * @param {string} name - 模型名称
 * @param {Object} config - 模型配置
 */
function renderReasonerModel(name, config) {
    const template = document.getElementById('reasoner-model-template');
    const clone = document.importNode(template.content, true);
    
    // 设置模型名称
    clone.querySelector('.model-name').textContent = name;
    
    // 设置表单值
    const form = clone.querySelector('.model-form');
    form.querySelector('.model-id').value = config.model_id || '';
    form.querySelector('.api-key').value = config.api_key || '';
    form.querySelector('.api-base-url').value = config.api_base_url || '';
    form.querySelector('.api-request-address').value = config.api_request_address || '';
    form.querySelector('.is-origin-reasoning').checked = config.is_origin_reasoning || false;
    form.querySelector('.is-valid').checked = config.is_valid || false;
    form.querySelector('.is-proxy-open').checked = config.proxy_open || false;
    
    // 绑定保存按钮事件
    form.querySelector('.save-model-btn').addEventListener('click', () => {
        saveReasonerModel(name, form);
    });
    
    // 绑定编辑按钮事件
    clone.querySelector('.edit-model-btn').addEventListener('click', () => {
        toggleFormEditable(form, true);
    });
    
    // 绑定删除按钮事件
    clone.querySelector('.delete-model-btn').addEventListener('click', () => {
        showDeleteConfirmation('reasoner', name);
    });
    
    // 默认禁用表单编辑
    toggleFormEditable(form, false);
    
    // 添加到容器
    reasonerModelsContainer.appendChild(clone);
}

/**
 * 渲染目标模型
 * @param {string} name - 模型名称
 * @param {Object} config - 模型配置
 */
function renderTargetModel(name, config) {
    const template = document.getElementById('target-model-template');
    const clone = document.importNode(template.content, true);
    
    // 设置模型名称
    clone.querySelector('.model-name').textContent = name;
    
    // 设置表单值
    const form = clone.querySelector('.model-form');
    form.querySelector('.model-id').value = config.model_id || '';
    form.querySelector('.api-key').value = config.api_key || '';
    form.querySelector('.api-base-url').value = config.api_base_url || '';
    form.querySelector('.api-request-address').value = config.api_request_address || '';
    form.querySelector('.model-format').value = config.model_format || 'openai';
    form.querySelector('.is-valid').checked = config.is_valid || false;
    form.querySelector('.is-proxy-open').checked = config.proxy_open || false;
    
    // 绑定保存按钮事件
    form.querySelector('.save-model-btn').addEventListener('click', () => {
        saveTargetModel(name, form);
    });
    
    // 绑定编辑按钮事件
    clone.querySelector('.edit-model-btn').addEventListener('click', () => {
        toggleFormEditable(form, true);
    });
    
    // 绑定删除按钮事件
    clone.querySelector('.delete-model-btn').addEventListener('click', () => {
        showDeleteConfirmation('target', name);
    });
    
    // 默认禁用表单编辑
    toggleFormEditable(form, false);
    
    // 添加到容器
    targetModelsContainer.appendChild(clone);
}

/**
 * 渲染组合模型
 * @param {string} name - 模型名称
 * @param {Object} config - 模型配置
 */
function renderCompositeModel(name, config) {
    const template = document.getElementById('composite-model-template');
    const clone = document.importNode(template.content, true);
    
    // 设置模型名称
    clone.querySelector('.model-name').textContent = name;
    
    // 设置表单值
    const form = clone.querySelector('.model-form');
    form.querySelector('.model-id').value = config.model_id || '';
    form.querySelector('.is-valid').checked = config.is_valid || false;
    
    // 填充推理模型选项
    const reasonerSelect = form.querySelector('.reasoner-model-select');
    reasonerSelect.innerHTML = '';
    Object.keys(configData.reasoner_models || {}).forEach(modelName => {
        const option = document.createElement('option');
        option.value = modelName;
        option.textContent = modelName;
        reasonerSelect.appendChild(option);
    });
    
    // 填充目标模型选项
    const targetSelect = form.querySelector('.target-model-select');
    targetSelect.innerHTML = '';
    Object.keys(configData.target_models || {}).forEach(modelName => {
        const option = document.createElement('option');
        option.value = modelName;
        option.textContent = modelName;
        targetSelect.appendChild(option);
    });
    
    // 设置选中的模型
    reasonerSelect.value = config.reasoner_models || '';
    targetSelect.value = config.target_models || '';
    
    // 绑定保存按钮事件
    form.querySelector('.save-model-btn').addEventListener('click', () => {
        saveCompositeModel(name, form);
    });
    
    // 绑定编辑按钮事件
    clone.querySelector('.edit-model-btn').addEventListener('click', () => {
        toggleFormEditable(form, true);
    });
    
    // 绑定删除按钮事件
    clone.querySelector('.delete-model-btn').addEventListener('click', () => {
        showDeleteConfirmation('composite', name);
    });
    
    // 默认禁用表单编辑
    toggleFormEditable(form, false);
    
    // 添加到容器
    compositeModelsContainer.appendChild(clone);
}

/**
 * 渲染代理设置
 */
function renderProxySettings() {
    const { proxy_open, proxy_address } = configData.proxy;
    
    proxyOpenSwitch.checked = proxy_open;
    proxyAddressInput.value = proxy_address || '';
}

/**
 * 渲染系统设置
 */
function renderSystemSettings() {
    const { allow_origins, log_level, api_key, save_deepseek_tokens, save_deepseek_tokens_max_tokens } = configData.system;
    
    // 清空允许的源容器
    allowOriginsContainer.innerHTML = '';
    
    // 添加允许的源输入框
    if (allow_origins && allow_origins.length > 0) {
        allow_origins.forEach(origin => {
            addAllowOriginInput(origin);
        });
    } else {
        addAllowOriginInput('*');
    }
    
    // 设置日志级别
    logLevelSelect.value = log_level || 'INFO';
    
    // 设置 API Key
    systemApiKeyInput.value = api_key || '123456';
    
    // 设置 DeepSeek tokens 相关设置
    const saveDeepseekTokensSwitch = document.getElementById('save-deepseek-tokens');
    const deepseekTokensMaxInput = document.getElementById('deepseek-tokens-max');
    const deepseekTokensMaxContainer = document.getElementById('deepseek-tokens-max-container');
    
    if (saveDeepseekTokensSwitch) {
        saveDeepseekTokensSwitch.checked = save_deepseek_tokens || false;
        
        // 根据开关状态显示/隐藏最大限制设置
        if (deepseekTokensMaxContainer) {
            deepseekTokensMaxContainer.style.display = saveDeepseekTokensSwitch.checked ? 'block' : 'none';
        }
        
        // 绑定开关变化事件
        saveDeepseekTokensSwitch.addEventListener('change', function() {
            if (deepseekTokensMaxContainer) {
                deepseekTokensMaxContainer.style.display = this.checked ? 'block' : 'none';
            }
        });
    }
    
    if (deepseekTokensMaxInput) {
        deepseekTokensMaxInput.value = save_deepseek_tokens_max_tokens || 5;
    }
}

/**
 * 切换表单可编辑状态
 * @param {HTMLFormElement} form - 表单元素
 * @param {boolean} editable - 是否可编辑
 */
function toggleFormEditable(form, editable) {
    const inputs = form.querySelectorAll('input, select');
    inputs.forEach(input => {
        input.disabled = !editable;
    });
    
    const saveBtn = form.querySelector('.save-model-btn');
    saveBtn.style.display = editable ? 'block' : 'none';
}

/**
 * 保存推理模型
 * @param {string} name - 模型名称
 * @param {HTMLFormElement} form - 表单元素
 */
function saveReasonerModel(name, form) {
    const modelConfig = {
        model_id: form.querySelector('.model-id').value,
        api_key: form.querySelector('.api-key').value,
        api_base_url: form.querySelector('.api-base-url').value,
        api_request_address: form.querySelector('.api-request-address').value,
        is_origin_reasoning: form.querySelector('.is-origin-reasoning').checked,
        is_valid: form.querySelector('.is-valid').checked,
        proxy_open: form.querySelector('.is-proxy-open').checked
    };
    
    configData.reasoner_models[name] = modelConfig;
    
    toggleFormEditable(form, false);
    showToast(`推理模型 ${name} 已保存`, 'success');
}

/**
 * 保存目标模型
 * @param {string} name - 模型名称
 * @param {HTMLFormElement} form - 表单元素
 */
function saveTargetModel(name, form) {
    const modelConfig = {
        model_id: form.querySelector('.model-id').value,
        api_key: form.querySelector('.api-key').value,
        api_base_url: form.querySelector('.api-base-url').value,
        api_request_address: form.querySelector('.api-request-address').value,
        model_format: form.querySelector('.model-format').value,
        is_valid: form.querySelector('.is-valid').checked,
        proxy_open: form.querySelector('.is-proxy-open').checked
    };
    
    configData.target_models[name] = modelConfig;
    
    toggleFormEditable(form, false);
    showToast(`目标模型 ${name} 已保存`, 'success');
}

/**
 * 保存组合模型
 * @param {string} name - 模型名称
 * @param {HTMLFormElement} form - 表单元素
 */
function saveCompositeModel(name, form) {
    const modelConfig = {
        model_id: form.querySelector('.model-id').value,
        reasoner_models: form.querySelector('.reasoner-model-select').value,
        target_models: form.querySelector('.target-model-select').value,
        is_valid: form.querySelector('.is-valid').checked
    };
    
    configData.composite_models[name] = modelConfig;
    
    toggleFormEditable(form, false);
    showToast(`组合模型 ${name} 已保存`, 'success');
}

/**
 * 保存代理设置
 */
function saveProxySettings() {
    try {
        configData.proxy.proxy_open = proxyOpenSwitch.checked;
        configData.proxy.proxy_address = proxyAddressInput.value.trim();
        
        saveAllConfigurations();
    } catch (error) {
        console.error('保存代理设置时发生错误:', error);
        showToast('保存代理设置失败: ' + error.message, 'danger');
    }
}

/**
 * 保存系统设置
 */
function saveSystemSettings() {
    try {
        // 获取允许的源
        const originInputs = document.querySelectorAll('.allow-origin');
        const origins = Array.from(originInputs).map(input => input.value.trim()).filter(value => value);
        
        // 获取日志级别
        const logLevel = logLevelSelect.value;
        
        // 获取 API Key
        const apiKey = systemApiKeyInput.value.trim() || '123456';
        
        // 获取 DeepSeek tokens 相关设置
        const saveDeepseekTokensSwitch = document.getElementById('save-deepseek-tokens');
        const deepseekTokensMaxInput = document.getElementById('deepseek-tokens-max');
        
        // 添加详细的调试信息
        console.log('调试信息 - DOM 元素状态:', {
            saveDeepseekTokensSwitch: saveDeepseekTokensSwitch,
            saveDeepseekTokensSwitchExists: !!saveDeepseekTokensSwitch,
            saveDeepseekTokensSwitchChecked: saveDeepseekTokensSwitch ? saveDeepseekTokensSwitch.checked : 'element not found',
            deepseekTokensMaxInput: deepseekTokensMaxInput,
            deepseekTokensMaxInputExists: !!deepseekTokensMaxInput,
            deepseekTokensMaxInputValue: deepseekTokensMaxInput ? deepseekTokensMaxInput.value : 'element not found'
        });
        
        const saveDeepseekTokens = saveDeepseekTokensSwitch ? saveDeepseekTokensSwitch.checked : false;
        const deepseekTokensMax = deepseekTokensMaxInput ? parseInt(deepseekTokensMaxInput.value) || 5 : 5;
        
        console.log('保存系统设置 - DeepSeek tokens 设置:', {
            saveDeepseekTokens,
            deepseekTokensMax
        });
        
        // 更新配置数据
        configData.system.allow_origins = origins;
        configData.system.log_level = logLevel;
        configData.system.api_key = apiKey;
        configData.system.save_deepseek_tokens = saveDeepseekTokens;
        configData.system.save_deepseek_tokens_max_tokens = deepseekTokensMax;
        
        console.log('更新后的配置数据 - 系统设置:', configData.system);
        
        saveAllConfigurations();
    } catch (error) {
        console.error('保存系统设置时发生错误:', error);
        showToast('保存系统设置失败: ' + error.message, 'danger');
    }
}

/**
 * 保存所有配置
 */
async function saveAllConfigurations() {
    try {
        // 在保存之前，先从界面读取最新的设置
        // 获取代理设置
        configData.proxy.proxy_open = proxyOpenSwitch.checked;
        configData.proxy.proxy_address = proxyAddressInput.value.trim();
        
        // 获取系统设置
        const originInputs = document.querySelectorAll('.allow-origin');
        const origins = Array.from(originInputs).map(input => input.value.trim()).filter(value => value);
        const logLevel = logLevelSelect.value;
        const apiKey = systemApiKeyInput.value.trim() || '123456';
        
        // 获取 DeepSeek tokens 相关设置
        const saveDeepseekTokensSwitch = document.getElementById('save-deepseek-tokens');
        const deepseekTokensMaxInput = document.getElementById('deepseek-tokens-max');
        
        console.log('saveAllConfigurations - 调试信息 - DOM 元素状态:', {
            saveDeepseekTokensSwitch: saveDeepseekTokensSwitch,
            saveDeepseekTokensSwitchExists: !!saveDeepseekTokensSwitch,
            saveDeepseekTokensSwitchChecked: saveDeepseekTokensSwitch ? saveDeepseekTokensSwitch.checked : 'element not found',
            deepseekTokensMaxInput: deepseekTokensMaxInput,
            deepseekTokensMaxInputExists: !!deepseekTokensMaxInput,
            deepseekTokensMaxInputValue: deepseekTokensMaxInput ? deepseekTokensMaxInput.value : 'element not found'
        });
        
        const saveDeepseekTokens = saveDeepseekTokensSwitch ? saveDeepseekTokensSwitch.checked : false;
        const deepseekTokensMax = deepseekTokensMaxInput ? parseInt(deepseekTokensMaxInput.value) || 5 : 5;
        
        // 更新系统配置
        configData.system.allow_origins = origins;
        configData.system.log_level = logLevel;
        configData.system.api_key = apiKey;
        configData.system.save_deepseek_tokens = saveDeepseekTokens;
        configData.system.save_deepseek_tokens_max_tokens = deepseekTokensMax;
        
        console.log('准备保存的完整配置数据:', JSON.stringify(configData, null, 2));
        
        showToast('正在保存配置...', 'info');
        
        const authApiKey = Auth.getCurrentApiKey();
        const response = await fetch(`${Auth.API_BASE_URL}/v1/config`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${authApiKey}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(configData)
        });
        
        console.log('保存配置请求响应状态:', response.status);
        
        if (!response.ok) {
            const errorText = await response.text();
            console.error('保存配置失败，响应内容:', errorText);
            throw new Error('保存配置失败');
        }
        
        const responseData = await response.json();
        console.log('保存配置成功，响应数据:', responseData);
        
        showToast('所有配置已保存', 'success');
    } catch (error) {
        console.error('保存配置时发生错误:', error);
        showToast('保存配置失败: ' + error.message, 'danger');
    }
}

/**
 * 显示添加模型对话框
 * @param {string} modelType - 模型类型：reasoner, target, composite
 */
function showAddModelModal(modelType) {
    // 设置对话框标题
    let title;
    switch (modelType) {
        case 'reasoner':
            title = '添加推理模型';
            break;
        case 'target':
            title = '添加目标模型';
            break;
        case 'composite':
            title = '添加组合模型';
            break;
    }
    addModelTitle.textContent = title;
    
    // 清空表单
    addModelForm.reset();
    addModelFields.innerHTML = '';
    
    // 存储模型类型
    addModelForm.dataset.modelType = modelType;
    
    // 显示对话框
    addModelModal.show();
}

/**
 * 处理添加模型
 */
function handleAddModel() {
    const modelType = addModelForm.dataset.modelType;
    const modelName = document.getElementById('new-model-name').value.trim();
    
    if (!modelName) {
        showToast('请输入模型名称', 'warning');
        return;
    }
    
    // 检查模型名称是否已存在
    let targetCollection;
    switch (modelType) {
        case 'reasoner':
            targetCollection = configData.reasoner_models;
            break;
        case 'target':
            targetCollection = configData.target_models;
            break;
        case 'composite':
            targetCollection = configData.composite_models;
            break;
    }
    
    if (targetCollection[modelName]) {
        showToast(`模型 ${modelName} 已存在`, 'warning');
        return;
    }
    
    // 创建默认配置
    let defaultConfig;
    switch (modelType) {
        case 'reasoner':
            defaultConfig = {
                model_id: '',
                api_key: '',
                api_base_url: '',
                api_request_address: '',
                is_origin_reasoning: true,
                is_valid: true
            };
            break;
        case 'target':
            defaultConfig = {
                model_id: '',
                api_key: '',
                api_base_url: '',
                api_request_address: '',
                model_format: 'openai',
                is_valid: true
            };
            break;
        case 'composite':
            // 获取第一个可用的推理模型和目标模型
            const firstReasonerModel = Object.keys(configData.reasoner_models || {})[0] || '';
            const firstTargetModel = Object.keys(configData.target_models || {})[0] || '';
            
            defaultConfig = {
                model_id: modelName,
                reasoner_models: firstReasonerModel,
                target_models: firstTargetModel,
                is_valid: true
            };
            break;
    }
    
    // 添加模型
    targetCollection[modelName] = defaultConfig;
    
    // 重新渲染模型
    renderModels();
    
    // 关闭对话框
    addModelModal.hide();
    
    showToast(`模型 ${modelName} 已添加`, 'success');
}

/**
 * 显示删除确认对话框
 * @param {string} modelType - 模型类型：reasoner, target, composite
 * @param {string} modelName - 模型名称
 */
function showDeleteConfirmation(modelType, modelName) {
    deleteModelNameSpan.textContent = modelName;
    
    // 存储模型信息
    confirmDeleteBtn.dataset.modelType = modelType;
    confirmDeleteBtn.dataset.modelName = modelName;
    
    // 绑定确认删除按钮事件
    confirmDeleteBtn.onclick = handleDeleteModel;
    
    // 显示对话框
    confirmDeleteModal.show();
}

/**
 * 处理删除模型
 */
function handleDeleteModel() {
    const modelType = confirmDeleteBtn.dataset.modelType;
    const modelName = confirmDeleteBtn.dataset.modelName;
    
    // 删除模型
    switch (modelType) {
        case 'reasoner':
            delete configData.reasoner_models[modelName];
            break;
        case 'target':
            delete configData.target_models[modelName];
            break;
        case 'composite':
            delete configData.composite_models[modelName];
            break;
    }
    
    // 重新渲染模型
    renderModels();
    
    // 关闭对话框
    confirmDeleteModal.hide();
    
    showToast(`模型 ${modelName} 已删除`, 'success');
}

/**
 * 添加允许的源输入框
 * @param {string} value - 初始值
 */
function addAllowOriginInput(value = '') {
    const inputGroup = document.createElement('div');
    inputGroup.className = 'input-group mb-2';
    
    const input = document.createElement('input');
    input.type = 'text';
    input.className = 'form-control allow-origin';
    input.placeholder = '例如: * 或 http://localhost:3000';
    input.value = value;
    
    const button = document.createElement('button');
    button.className = 'btn btn-outline-secondary remove-origin-btn';
    button.type = 'button';
    button.innerHTML = '<i class="bi bi-trash"></i>';
    button.addEventListener('click', () => {
        if (document.querySelectorAll('.allow-origin').length > 1) {
            inputGroup.remove();
        }
    });
    
    inputGroup.appendChild(input);
    inputGroup.appendChild(button);
    
    allowOriginsContainer.appendChild(inputGroup);
}

/**
 * 显示提示框
 * @param {string} message - 提示信息
 * @param {string} type - 提示类型：success, info, warning, danger
 */
function showToast(message, type) {
    const toastContainer = document.getElementById('toast-container');
    
    const toastId = 'toast-' + Date.now();
    const toastHTML = `
        <div id="${toastId}" class="toast" role="alert" aria-live="assertive" aria-atomic="true" data-bs-delay="3000">
            <div class="toast-header bg-${type} text-white">
                <strong class="me-auto">提示</strong>
                <button type="button" class="btn-close btn-close-white" data-bs-dismiss="toast" aria-label="Close"></button>
            </div>
            <div class="toast-body">
                ${message}
            </div>
        </div>
    `;
    
    toastContainer.insertAdjacentHTML('beforeend', toastHTML);
    
    const toastElement = document.getElementById(toastId);
    const toast = new bootstrap.Toast(toastElement);
    toast.show();
    
    // 自动移除
    toastElement.addEventListener('hidden.bs.toast', () => {
        toastElement.remove();
    });
}

/**
 * 导出配置文件
 */
async function exportConfiguration() {
    try {
        showToast('正在导出配置...', 'info');
        
        const apiKey = Auth.getCurrentApiKey();
        const response = await fetch(`${Auth.API_BASE_URL}/v1/config/export`, {
            headers: {
                'Authorization': `Bearer ${apiKey}`
            }
        });
        
        if (!response.ok) {
            throw new Error('导出配置失败');
        }
        
        const configData = await response.json();
        
        // 创建下载链接
        const dataStr = JSON.stringify(configData, null, 2);
        const dataBlob = new Blob([dataStr], { type: 'application/json' });
        const url = URL.createObjectURL(dataBlob);
        
        // 生成文件名
        const now = new Date();
        const timestamp = now.toISOString().replace(/[:.]/g, '-').slice(0, 19);
        const filename = `deepclaude_config_${timestamp}.json`;
        
        // 创建下载链接并触发下载
        const link = document.createElement('a');
        link.href = url;
        link.download = filename;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        
        // 清理URL
        URL.revokeObjectURL(url);
        
        showToast('配置导出成功', 'success');
    } catch (error) {
        console.error('导出配置时发生错误:', error);
        showToast('导出配置失败: ' + error.message, 'danger');
    }
}

/**
 * 处理配置文件选择
 * @param {Event} event - 文件选择事件
 */
function handleConfigFileSelect(event) {
    const file = event.target.files[0];
    if (!file) {
        configPreview.classList.add('d-none');
        confirmImportBtn.disabled = true;
        selectedConfigData = null;
        return;
    }
    
    // 检查文件类型
    if (!file.name.endsWith('.json')) {
        showToast('请选择JSON格式的配置文件', 'warning');
        configFileInput.value = '';
        configPreview.classList.add('d-none');
        confirmImportBtn.disabled = true;
        selectedConfigData = null;
        return;
    }
    
    // 读取文件内容
    const reader = new FileReader();
    reader.onload = function(e) {
        try {
            const configContent = JSON.parse(e.target.result);
            selectedConfigData = configContent;
            
            // 显示配置预览
            displayConfigPreview(configContent);
            configPreview.classList.remove('d-none');
            confirmImportBtn.disabled = false;
            
        } catch (error) {
            showToast('配置文件格式不正确，请选择有效的JSON文件', 'danger');
            configFileInput.value = '';
            configPreview.classList.add('d-none');
            confirmImportBtn.disabled = true;
            selectedConfigData = null;
        }
    };
    
    reader.readAsText(file);
}

/**
 * 显示配置预览
 * @param {Object} config - 配置数据
 */
function displayConfigPreview(config) {
    const preview = document.createElement('div');
    preview.className = 'small';
    
    // 统计配置信息
    const reasonerCount = Object.keys(config.reasoner_models || {}).length;
    const targetCount = Object.keys(config.target_models || {}).length;
    const compositeCount = Object.keys(config.composite_models || {}).length;
    
    // 检查是否有导出元数据
    const exportTime = config._export_metadata?.export_time || '未知';
    const exportSource = config._export_metadata?.source || '未知';
    
    preview.innerHTML = `
        <div class="mb-2">
            <strong>配置统计：</strong>
        </div>
        <ul class="mb-2">
            <li>推理模型：${reasonerCount} 个</li>
            <li>目标模型：${targetCount} 个</li>
            <li>组合模型：${compositeCount} 个</li>
        </ul>
        <div class="mb-2">
            <strong>导出信息：</strong>
        </div>
        <ul class="mb-0">
            <li>导出时间：${exportTime}</li>
            <li>来源：${exportSource}</li>
        </ul>
    `;
    
    configPreviewContent.innerHTML = '';
    configPreviewContent.appendChild(preview);
}

/**
 * 处理配置导入
 */
async function handleConfigImport() {
    if (!selectedConfigData) {
        showToast('请先选择配置文件', 'warning');
        return;
    }
    
    try {
        showToast('正在导入配置...', 'info');
        
        const apiKey = Auth.getCurrentApiKey();
        const response = await fetch(`${Auth.API_BASE_URL}/v1/config/import`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${apiKey}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(selectedConfigData)
        });
        
        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.error || '导入配置失败');
        }
        
        // 关闭模态框
        importConfigModal.hide();
        
        // 清理状态
        configFileInput.value = '';
        configPreview.classList.add('d-none');
        confirmImportBtn.disabled = true;
        selectedConfigData = null;
        
        // 重新加载配置数据
        await loadConfigData();
        
        showToast('配置导入成功', 'success');
    } catch (error) {
        console.error('导入配置时发生错误:', error);
        showToast('导入配置失败: ' + error.message, 'danger');
    }
}

// 导出函数和变量
window.Config = {
    init: initConfig,
    load: loadConfigData
};