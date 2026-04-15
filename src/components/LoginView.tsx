import { LogIn, UserCircle } from 'lucide-react';

interface LoginViewProps {
  onGoogleLogin: () => void;
  onGuestLogin: () => void;
}

export function LoginView({ onGoogleLogin, onGuestLogin }: LoginViewProps) {
  return (
    <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center p-4">
      <div className="w-full max-w-md bg-white rounded-3xl shadow-xl border border-gray-100 p-8 space-y-8 animate-in fade-in zoom-in duration-300">
        <div className="text-center space-y-3">
          <div className="w-20 h-20 bg-gradient-to-br from-indigo-500 to-purple-600 text-white rounded-3xl flex items-center justify-center mx-auto shadow-lg rotate-3">
            <LogIn className="w-10 h-10" />
          </div>
          <h1 className="text-3xl font-extrabold text-gray-900 tracking-tight">群組分帳</h1>
          <p className="text-gray-500 font-medium">輕鬆管理多人旅遊、聚餐開銷</p>
        </div>

        <div className="space-y-4 pt-4">
          <button 
            onClick={onGoogleLogin}
            className="w-full flex items-center justify-center gap-3 px-6 py-4 bg-white border-2 border-gray-100 rounded-2xl font-bold text-gray-700 hover:border-indigo-600 hover:bg-gray-50 transition-all duration-200 group active:scale-[0.98]"
          >
            <img src="https://www.google.com/favicon.ico" alt="Google" className="w-5 h-5" />
            使用 Google 登入
          </button>

          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-gray-100"></div>
            </div>
            <div className="relative flex justify-center text-xs uppercase tracking-widest font-bold">
              <span className="px-4 bg-white text-gray-400">或者</span>
            </div>
          </div>

          <button 
            onClick={onGuestLogin}
            className="w-full flex items-center justify-center gap-3 px-6 py-4 bg-indigo-600 text-white rounded-2xl font-bold hover:bg-indigo-700 shadow-md shadow-indigo-200 transition-all duration-200 active:scale-[0.98]"
          >
            <UserCircle className="w-6 h-6" />
            以訪客身份繼續
          </button>
          
          <p className="text-center text-[10px] text-gray-400 leading-relaxed px-4">
            訪客資料將儲存在此裝置瀏覽器中，登出或清除快取後將無法找回。建議使用 Google 登入。
          </p>
        </div>
      </div>
    </div>
  );
}
