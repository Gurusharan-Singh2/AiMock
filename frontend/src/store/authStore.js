import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { immer } from 'zustand/middleware/immer';


const useAuthStore = create(
  persist(
    immer((set, get) => ({
      user: null,
      token: null,
      phone: null,

      login: (data) => {
        set((state) => {
          state.user = {
            name: data.name,
            userId: data.userId,
            email: data.email,
            phone: data.phone,
          };
          state.token = data.token;
        });
      },

      logout: () => {
        set((state) => {
          state.user = null;
          state.token = null;
          state.phone = null;
        });
      },

      isLoggedIn: () => {
        const { token } = get();
        return !!token;
      },

    
      isAuthenticated: async () => {
        if (!useAuthStore.persist.hasHydrated()) {
          await new Promise((resolve) => {
            const unsub = useAuthStore.persist.onFinishHydration(() => {
              unsub();
              resolve();
            });
          });
        }
        return !!get().token;
      },
    })),
    {
      name: 'auth-storage',
      storage: createJSONStorage(() => localStorage), 
    }
  )
);

export default useAuthStore;