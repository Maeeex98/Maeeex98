import * as THREE from 'three';
import ThreeGlobe from 'three-globe';
import './style.css';

class WorldMap3D {
  constructor() {
    this.scene = null;
    this.camera = null;
    this.renderer = null;
    this.globe = null;
    this.controls = null;
    this.animationId = null;
    this.rotationSpeed = 0.005;
    
    this.init();
    this.setupEventListeners();
  }

  async init() {
    // Создание сцены
    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color(0x0a0a0a);

    // Создание камеры
    this.camera = new THREE.PerspectiveCamera(
      75,
      window.innerWidth / window.innerHeight,
      0.1,
      1000
    );
    this.camera.position.z = 300;

    // Создание рендерера
    this.renderer = new THREE.WebGLRenderer({ antialias: true });
    this.renderer.setSize(window.innerWidth, window.innerHeight);
    this.renderer.shadowMap.enabled = true;
    this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;

    const container = document.getElementById('globe-container');
    container.appendChild(this.renderer.domElement);

    // Создание глобуса
    await this.createGlobe();

    // Добавление освещения
    this.addLighting();

    // Добавление звезд
    this.addStars();

    // Настройка управления
    this.setupControls();

    // Скрытие загрузки
    document.getElementById('loading').style.display = 'none';

    // Запуск анимации
    this.animate();
  }

  async createGlobe() {
    this.globe = new ThreeGlobe()
      .globeImageUrl('https://unpkg.com/three-globe/example/img/earth-blue-marble.jpg')
      .bumpImageUrl('https://unpkg.com/three-globe/example/img/earth-topology.png')
      .backgroundImageUrl('https://unpkg.com/three-globe/example/img/night-sky.png');

    // Настройка материала глобуса
    this.globe.globeMaterial().shininess = 0.8;
    this.globe.globeMaterial().transparent = true;
    this.globe.globeMaterial().opacity = 0.9;

    this.scene.add(this.globe);

    // Добавление случайных точек на глобусе
    this.addRandomPoints();
  }

  addRandomPoints() {
    const pointsData = [];
    for (let i = 0; i < 100; i++) {
      pointsData.push({
        lat: (Math.random() - 0.5) * 180,
        lng: (Math.random() - 0.5) * 360,
        size: Math.random() * 0.5 + 0.1,
        color: ['#ff6b6b', '#4ecdc4', '#45b7d1', '#96ceb4', '#feca57'][Math.floor(Math.random() * 5)]
      });
    }

    this.globe
      .pointsData(pointsData)
      .pointAltitude('size')
      .pointColor('color')
      .pointRadius(0.5);
  }

  addLighting() {
    // Направленный свет (солнце)
    const directionalLight = new THREE.DirectionalLight(0xffffff, 1);
    directionalLight.position.set(5, 3, 5);
    directionalLight.castShadow = true;
    this.scene.add(directionalLight);

    // Окружающий свет
    const ambientLight = new THREE.AmbientLight(0x404040, 0.4);
    this.scene.add(ambientLight);

    // Точечный свет
    const pointLight = new THREE.PointLight(0x4ecdc4, 0.5, 1000);
    pointLight.position.set(-200, -200, -200);
    this.scene.add(pointLight);
  }

  addStars() {
    const starsGeometry = new THREE.BufferGeometry();
    const starsMaterial = new THREE.PointsMaterial({
      color: 0xffffff,
      size: 1,
      transparent: true,
      opacity: 0.8
    });

    const starsVertices = [];
    for (let i = 0; i < 10000; i++) {
      const x = (Math.random() - 0.5) * 2000;
      const y = (Math.random() - 0.5) * 2000;
      const z = (Math.random() - 0.5) * 2000;
      starsVertices.push(x, y, z);
    }

    starsGeometry.setAttribute('position', new THREE.Float32BufferAttribute(starsVertices, 3));
    const stars = new THREE.Points(starsGeometry, starsMaterial);
    this.scene.add(stars);
  }

  setupControls() {
    let isDragging = false;
    let previousMousePosition = { x: 0, y: 0 };

    this.renderer.domElement.addEventListener('mousedown', (e) => {
      isDragging = true;
      previousMousePosition = { x: e.clientX, y: e.clientY };
    });

    this.renderer.domElement.addEventListener('mousemove', (e) => {
      if (isDragging) {
        const deltaMove = {
          x: e.clientX - previousMousePosition.x,
          y: e.clientY - previousMousePosition.y
        };

        this.globe.rotation.y += deltaMove.x * 0.005;
        this.globe.rotation.x += deltaMove.y * 0.005;

        previousMousePosition = { x: e.clientX, y: e.clientY };
      }
    });

    this.renderer.domElement.addEventListener('mouseup', () => {
      isDragging = false;
    });

    this.renderer.domElement.addEventListener('wheel', (e) => {
      e.preventDefault();
      const scale = e.deltaY > 0 ? 1.1 : 0.9;
      this.camera.position.multiplyScalar(scale);
    });
  }

  setupEventListeners() {
    // Управление скоростью вращения
    document.getElementById('rotationSpeed').addEventListener('input', (e) => {
      this.rotationSpeed = parseFloat(e.target.value);
    });

    // Управление высотой камеры
    document.getElementById('altitude').addEventListener('input', (e) => {
      const altitude = parseFloat(e.target.value);
      this.camera.position.setLength(altitude * 100);
    });

    // Сброс вида
    document.getElementById('resetView').addEventListener('click', () => {
      this.camera.position.set(0, 0, 300);
      this.globe.rotation.set(0, 0, 0);
    });

    // Обработка изменения размера окна
    window.addEventListener('resize', () => {
      this.camera.aspect = window.innerWidth / window.innerHeight;
      this.camera.updateProjectionMatrix();
      this.renderer.setSize(window.innerWidth, window.innerHeight);
    });
  }

  animate() {
    this.animationId = requestAnimationFrame(() => this.animate());

    // Автоматическое вращение
    if (this.globe) {
      this.globe.rotation.y += this.rotationSpeed;
    }

    this.renderer.render(this.scene, this.camera);
  }

  destroy() {
    if (this.animationId) {
      cancelAnimationFrame(this.animationId);
    }
    if (this.renderer) {
      this.renderer.dispose();
    }
  }
}

// Система поддержки
class SupportSystem {
  constructor() {
    this.setupEventListeners();
  }

  setupEventListeners() {
    const supportBtn = document.getElementById('supportBtn');
    const supportModal = document.getElementById('supportModal');
    const responseModal = document.getElementById('responseModal');
    const closeModal = document.getElementById('closeModal');
    const closeResponseModal = document.getElementById('closeResponseModal');
    const supportForm = document.getElementById('supportForm');

    // Открытие модального окна поддержки
    supportBtn.addEventListener('click', () => {
      supportModal.style.display = 'flex';
    });

    // Закрытие модальных окон
    closeModal.addEventListener('click', () => {
      supportModal.style.display = 'none';
    });

    closeResponseModal.addEventListener('click', () => {
      responseModal.style.display = 'none';
    });

    // Закрытие по клику вне модального окна
    window.addEventListener('click', (e) => {
      if (e.target === supportModal) {
        supportModal.style.display = 'none';
      }
      if (e.target === responseModal) {
        responseModal.style.display = 'none';
      }
    });

    // Обработка отправки формы
    supportForm.addEventListener('submit', (e) => {
      e.preventDefault();
      this.handleFormSubmit(e.target);
    });
  }

  async handleFormSubmit(form) {
    const formData = new FormData(form);
    const data = Object.fromEntries(formData);

    // Показать состояние загрузки
    const submitBtn = form.querySelector('.submit-btn');
    const btnText = submitBtn.querySelector('.btn-text');
    const btnLoading = submitBtn.querySelector('.btn-loading');
    
    btnText.style.display = 'none';
    btnLoading.style.display = 'inline';
    submitBtn.disabled = true;

    try {
      // Имитация отправки email (заглушка)
      await this.sendToGmail(data);
      
      // Показать ответ
      this.showResponse(data);
      
      // Закрыть форму поддержки
      document.getElementById('supportModal').style.display = 'none';
      
      // Сбросить форму
      form.reset();
      
    } catch (error) {
      alert('Ошибка при отправке сообщения. Попробуйте еще раз.');
    } finally {
      // Восстановить кнопку
      btnText.style.display = 'inline';
      btnLoading.style.display = 'none';
      submitBtn.disabled = false;
    }
  }

  async sendToGmail(data) {
    // Заглушка для отправки в Gmail
    // В реальном приложении здесь был бы API вызов
    console.log('Отправка в Gmail (заглушка):', {
      to: 'support@maeeex98.fake',
      from: data.userEmail,
      subject: `[Поддержка] ${data.subject} - ${data.userName}`,
      body: data.message
    });

    // Имитация задержки сети
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    return {
      success: true,
      messageId: this.generateTicketNumber(),
      timestamp: new Date().toISOString()
    };
  }

  showResponse(originalData) {
    const responseModal = document.getElementById('responseModal');
    const responseTime = document.getElementById('responseTime');
    const ticketNumber = document.getElementById('ticketNumber');

    // Установить данные ответа
    responseTime.textContent = new Date().toLocaleString('ru-RU');
    ticketNumber.textContent = this.generateTicketNumber();

    // Показать модальное окно ответа
    responseModal.style.display = 'flex';
  }

  generateTicketNumber() {
    return 'TKT-' + Date.now().toString(36).toUpperCase() + '-' + Math.random().toString(36).substr(2, 4).toUpperCase();
  }
}

// Инициализация приложения
document.addEventListener('DOMContentLoaded', () => {
  const worldMap = new WorldMap3D();
  const supportSystem = new SupportSystem();

  // Обработка выгрузки страницы
  window.addEventListener('beforeunload', () => {
    worldMap.destroy();
  });
});