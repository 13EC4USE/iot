# IoT웹앱 설정 가이드

## 1. 환경 변수 설정

`.env.local` 파일을 생성하고 다음을 추가하세요:

\`\`\`env
# Supabase
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key

# MQTT (HiveMQ Cloud)
NEXT_PUBLIC_MQTT_BROKER=wss://broker.hivemq.com:8884/mqtt
NEXT_PUBLIC_MQTT_USERNAME=your_mqtt_username
NEXT_PUBLIC_MQTT_PASSWORD=your_mqtt_password

# App
NEXT_PUBLIC_DEV_SUPABASE_REDIRECT_URL=http://localhost:3000
NODE_ENV=development
\`\`\`

## 2. 데이터베이스 마이그레이션

Supabase 콘솔에서 다음 SQL 스크립트를 실행하세요:

1. `scripts/001_create_iot_schema.sql` 실행
2. `scripts/002_create_profiles_trigger.sql` 실행

## 3. HiveMQ Cloud 설정

1. [HiveMQ Cloud](https://www.hivemq.cloud/) 에서 클라우드 클러스터 생성
2. 클러스터 정보를 환경 변수에 설정

## 4. 의존성 설치

\`\`\`bash
npm install
\`\`\`

## 5. 개발 서버 시작

\`\`\`bash
npm run dev
\`\`\`

브라우저에서 http://localhost:3000 으로 이동

## 6. 로그인

기본 계정:
- 이메일: admin@iot.com
- 비밀번호: password123

## 시스템 아키텍처

### Frontend
- Next.js 16 with React 19
- Tailwind CSS 4 + shadcn/ui
- SWR for state management
- MQTT.js for IoT communication

### Backend
- Supabase PostgreSQL Database
- Row Level Security (RLS)
- REST API Routes
- Server Actions

### Database
- `users` - 사용자 정보
- `devices` - 등록된 IoT 디바이스
- `sensor_data` - 센서 데이터
- `device_alerts` - 알림
- `device_settings` - 디바이스 설정

### MQTT Topics
- `devices/{deviceId}/data` - 센서 데이터 수신
- `devices/{deviceId}/control/{action}` - 제어 명령 송신
- `devices/{deviceId}/alerts` - 알림 수신

## 코드 포매팅

\`\`\`bash
npm run format        # 코드 포매팅
npm run format:check  # 포매팅 확인
\`\`\`

## API 엔드포인트

### 디바이스 관리
- `GET /api/devices` - 모든 디바이스 조회
- `POST /api/devices` - 새 디바이스 추가
- `GET /api/devices/[id]` - 특정 디바이스 조회
- `PUT /api/devices/[id]` - 디바이스 업데이트
- `DELETE /api/devices/[id]` - 디바이스 삭제

### 디바이스 제어
- `POST /api/devices/[id]/control` - 디바이스 제어 (power, threshold)

### 센서 데이터
- `GET /api/devices/[id]/data` - 센서 데이터 조회
- `POST /api/devices/[id]/data` - 센서 데이터 기록

### 알림
- `GET /api/alerts` - 알림 조회
- `POST /api/alerts` - 알림 생성

## 문제 해결

### Supabase 연결 오류
- 환경 변수 확인
- Supabase 프로젝트 설정 확인

### MQTT 연결 오류
- HiveMQ 클러스터 상태 확인
- 환경 변수에서 MQTT 주소 확인
- 방화벽 설정 확인

### 데이터베이스 RLS 오류
- 사용자가 인증되었는지 확인
- RLS 정책이 올바르게 설정되었는지 확인
