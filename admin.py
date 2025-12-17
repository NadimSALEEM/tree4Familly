import tkinter as tk
from tkinter import ttk, messagebox
import json
import os
import subprocess
import threading
import time

# --- CONFIGURATION ---
MENU_FILE = "public/menu.json"

# --- USERS & PASSWORDS ---
USERS = {
    "boss":   {"pass": "admin", "venue": "all",  "name": "المدير العام (Boss)"},
    "res1":   {"pass": "1234",  "venue": "res1", "name": "مدير المطعم 1"},
    "res2":   {"pass": "5678",  "venue": "res2", "name": "مدير المطعم 2"},
    "cafe":   {"pass": "0000",  "venue": "cafe", "name": "مدير الكافيتريا"}
}

CATEGORIES = [
    "سندويشات", "بيتزا", "وجبات", "وجبات غربية", 
    "مشروبات", "مشروبات ساخنة", "مشروبات باردة", 
    "عصائر فريش", "كوكتيلات", "اراكيل", 
    "حلويات", "مقبلات", "تسالي", "موالح"
]

VENUES = {
    "المطعم 1": "res1",
    "المطعم 2": "res2",
    "الكافيتريا": "cafe"
}
VENUES_REVERSE = {v: k for k, v in VENUES.items()}


# --- LOGIN WINDOW ---
class LoginWindow:
    def __init__(self, root):
        self.root = root
        self.root.title("تسجيل الدخول - Tree 4")
        self.root.geometry("400x500")
        self.root.configure(bg="#2c3e50")
        self.root.eval('tk::PlaceWindow . center')

        tk.Label(root, text="Tree 4. Family", font=("Arial", 24, "bold"), bg="#2c3e50", fg="white").pack(pady=(60, 10))
        tk.Label(root, text="لوحة التحكم", font=("Arial", 14), bg="#2c3e50", fg="#bdc3c7").pack(pady=(0, 30))

        tk.Label(root, text="اختر المستخدم:", font=("Arial", 12), bg="#2c3e50", fg="white").pack()
        self.user_var = tk.StringVar()
        self.combo_user = ttk.Combobox(root, textvariable=self.user_var, state="readonly", font=("Arial", 12))
        self.combo_user['values'] = [f"{k} - {v['name']}" for k, v in USERS.items()]
        self.combo_user.current(0)
        self.combo_user.pack(pady=5, ipadx=10, ipady=5)

        tk.Label(root, text="كلمة المرور:", font=("Arial", 12), bg="#2c3e50", fg="white").pack(pady=(15, 0))
        self.ent_pass = tk.Entry(root, show="*", font=("Arial", 14), justify='center')
        self.ent_pass.pack(pady=5, ipadx=10, ipady=5)
        self.ent_pass.bind('<Return>', self.check_login)

        btn_login = tk.Button(root, text="دخول 🔓", command=self.check_login, bg="#27ae60", fg="white", font=("Arial", 14, "bold"), width=15)
        btn_login.pack(pady=30)

    def check_login(self, event=None):
        selection = self.combo_user.get()
        user_key = selection.split(" - ")[0]
        password = self.ent_pass.get()

        if user_key in USERS and USERS[user_key]["pass"] == password:
            user_data = USERS[user_key]
            self.root.destroy()
            new_root = tk.Tk()
            app = RestaurantAdminApp(new_root, user_data)
            new_root.mainloop()
        else:
            messagebox.showerror("خطأ", "كلمة المرور خاطئة!")


# --- MAIN APP ---
class RestaurantAdminApp:
    def __init__(self, root, user_data):
        self.root = root
        self.user_venue = user_data["venue"]
        self.user_name = user_data["name"]
        
        self.root.title(f"لوحة التحكم - {self.user_name}")
        self.root.geometry("1100x700")
        
        self.font_header = ("Arial", 14, "bold")
        self.font_label = ("Arial", 11)
        self.font_entry = ("Arial", 11)
        
        self.menu_data = self.load_data()
        self.current_edit_id = None 

        # Layout
        header_frame = tk.Frame(root, bg="#34495e", height=50)
        header_frame.pack(fill="x")
        tk.Label(header_frame, text=f"👤 مرحباً بك: {self.user_name}", bg="#34495e", fg="white", font=("Arial", 12, "bold")).pack(side="right", padx=20, pady=10)

        content_frame = tk.Frame(root)
        content_frame.pack(fill="both", expand=True)

        self.frame_table = tk.Frame(content_frame, bg="#f0f0f0")
        self.frame_table.place(relx=0.35, rely=0, relwidth=0.65, relheight=1)

        self.frame_form = tk.Frame(content_frame, bg="white", padx=20, pady=20)
        self.frame_form.place(relx=0, rely=0, relwidth=0.35, relheight=1)
        
        self.frame_deploy = tk.Frame(root, bg="#2c3e50", height=60)
        self.frame_deploy.pack(fill="x", side="bottom")

        self.setup_form()
        self.setup_table()
        self.setup_deploy_bar()
        self.refresh_table()

    def load_data(self):
        if not os.path.exists(MENU_FILE):
            return []
        try:
            with open(MENU_FILE, "r", encoding="utf-8") as f:
                return json.load(f)
        except:
            return []

    def save_data(self):
        with open(MENU_FILE, "w", encoding="utf-8") as f:
            json.dump(self.menu_data, f, ensure_ascii=False, indent=2)

    def setup_form(self):
        tk.Label(self.frame_form, text="إضافة / تعديل مادة", font=("Arial", 16, "bold"), bg="white", fg="#2c3e50").pack(pady=(0, 15))

        def create_field(label_text, widget_type="entry", options=None, editable=True):
            tk.Label(self.frame_form, text=label_text, font=self.font_label, bg="white", anchor="e").pack(fill="x")
            if widget_type == "entry":
                widget = tk.Entry(self.frame_form, font=self.font_entry, justify="right", bg="#f9f9f9")
            elif widget_type == "combo":
                state = "normal" if editable else "readonly"
                widget = ttk.Combobox(self.frame_form, values=options, state=state, font=self.font_entry, justify="right")
            widget.pack(fill="x", pady=(0, 10), ipady=4)
            return widget

        self.ent_name = create_field("اسم المادة:")
        self.ent_price = create_field("السعر (ل.س):")
        self.ent_desc = create_field("الوصف:")
        self.cmb_category = create_field("التصنيف (اختر أو اكتب جديد):", "combo", CATEGORIES, editable=True)
        self.cmb_venue = create_field("القسم (المكان):", "combo", list(VENUES.keys()), editable=False)
        
        if self.user_venue != "all":
            my_venue_name = VENUES_REVERSE.get(self.user_venue)
            self.cmb_venue.set(my_venue_name)
            self.cmb_venue.config(state="disabled")

        self.var_ismenu = tk.BooleanVar()
        tk.Checkbutton(self.frame_form, text="متوفر كوجبة كاملة؟", variable=self.var_ismenu, bg="white", font=self.font_label).pack(pady=10)

        btn_frame = tk.Frame(self.frame_form, bg="white")
        btn_frame.pack(fill="x", pady=20)

        self.btn_save = tk.Button(btn_frame, text="✅ حفظ المادة", command=self.save_item, bg="#27ae60", fg="white", font=self.font_header, pady=5)
        self.btn_save.pack(side="left", fill="x", expand=True, padx=5)

        self.btn_clear = tk.Button(btn_frame, text="❌ إلغاء", command=self.clear_form, bg="#95a5a6", fg="white", font=self.font_header, pady=5)
        self.btn_clear.pack(side="right", padx=5)

    def setup_table(self):
        search_frame = tk.Frame(self.frame_table, bg="#f0f0f0", pady=10)
        search_frame.pack(fill="x", padx=10)
        tk.Label(search_frame, text="🔍 بحث:", bg="#f0f0f0", font=self.font_label).pack(side="right", padx=5)
        self.ent_search = tk.Entry(search_frame, font=self.font_entry, justify="right")
        self.ent_search.pack(side="right", fill="x", expand=True)
        self.ent_search.bind("<KeyRelease>", lambda e: self.refresh_table())

        cols = ("name", "price", "cat", "venue")
        self.tree = ttk.Treeview(self.frame_table, columns=cols, show="headings")
        
        self.tree.heading("name", text="المادة")
        self.tree.heading("price", text="السعر")
        self.tree.heading("cat", text="التصنيف")
        self.tree.heading("venue", text="القسم")

        self.tree.column("name", anchor="e", width=140)
        self.tree.column("price", anchor="center", width=80)
        self.tree.column("cat", anchor="center", width=100)
        self.tree.column("venue", anchor="center", width=80)

        scrollbar = ttk.Scrollbar(self.frame_table, orient="vertical", command=self.tree.yview)
        self.tree.configure(yscroll=scrollbar.set)
        scrollbar.pack(side="right", fill="y")
        self.tree.pack(fill="both", expand=True, padx=10, pady=5)

        self.tree.bind("<Double-1>", self.on_item_select)

        btn_del = tk.Button(self.frame_table, text="🗑 حذف المحدد", command=self.delete_item, bg="#c0392b", fg="white", font=("Arial", 12, "bold"))
        btn_del.pack(fill="x", padx=10, pady=10)

    def setup_deploy_bar(self):
        self.lbl_status = tk.Label(self.frame_deploy, text="جاهز", bg="#2c3e50", fg="#bdc3c7", font=("Arial", 10))
        self.lbl_status.pack(side="left", padx=20, pady=20)
        btn_deploy = tk.Button(self.frame_deploy, text="🚀 رفع التعديلات (Deploy)", command=self.start_deploy, bg="#e67e22", fg="white", font=("Arial", 12, "bold"))
        btn_deploy.pack(side="right", padx=20, pady=10)

    def refresh_table(self):
        for row in self.tree.get_children():
            self.tree.delete(row)
        
        search_txt = self.ent_search.get().lower()

        for item in self.menu_data:
            item_venue = item.get("venue", "res1")
            if self.user_venue != "all" and item_venue != self.user_venue:
                continue 

            name = item.get("name", "")
            if search_txt in name.lower():
                venue_display = VENUES_REVERSE.get(item_venue, item_venue)
                self.tree.insert("", "end", values=(name, item.get("price"), item.get("category"), venue_display), tags=(item["id"],))

    # --- THE NEW VALIDATION LOGIC IS HERE ---
    def save_item(self):
        # 1. Get Values & Clean Whitespace
        name = self.ent_name.get().strip()
        price_str = self.ent_price.get().strip()
        cat = self.cmb_category.get().strip()
        venue_name = self.cmb_venue.get()

        # 2. VALIDATION: Check for empty fields
        if not name or not price_str or not venue_name or not cat:
            messagebox.showwarning("تنبيه", "يرجى تعبئة كافة الحقول (الاسم، السعر، التصنيف، القسم)")
            return

        # 3. VALIDATION: Check Price is a valid number
        try:
            # We filter out any accidental non-digits like "2000 sp" -> "2000"
            # But relying on float() is safer.
            price = int(price_str)
            if price < 0:
                messagebox.showerror("خطأ", "السعر لا يمكن أن يكون سالباً!")
                return
        except ValueError:
             messagebox.showerror("خطأ في السعر", "يرجى إدخال أرقام فقط في حقل السعر (مثال: 5000)")
             return

        # 4. VALIDATION: Security Check
        venue_code = VENUES[venue_name]
        if self.user_venue != "all" and venue_code != self.user_venue:
             messagebox.showerror("خطأ أمني", "لا يمكنك إضافة مواد لقسم آخر!")
             return
        
        # 5. Smart Category Learning
        current_values = list(self.cmb_category['values'])
        if cat not in current_values:
            current_values.append(cat)
            self.cmb_category['values'] = sorted(current_values)

        # 6. Save Logic
        if self.current_edit_id:
            # UPDATE
            for item in self.menu_data:
                if item["id"] == self.current_edit_id:
                    item.update({
                        "name": name,
                        "price": str(price), # Save as string to match JSON format
                        "description": self.ent_desc.get().strip(),
                        "category": cat,
                        "venue": venue_code,
                        "ismenu": self.var_ismenu.get()
                    })
                    break
            messagebox.showinfo("تم", "تم تعديل المادة بنجاح")
        else:
            # ADD
            new_id = str(int(time.time()))
            new_item = {
                "id": new_id,
                "name": name,
                "price": str(price),
                "description": self.ent_desc.get().strip(),
                "category": cat,
                "venue": venue_code,
                "ismenu": self.var_ismenu.get(),
                "menu": True
            }
            self.menu_data.append(new_item)
            messagebox.showinfo("تم", "تم إضافة المادة بنجاح")

        self.save_data()
        self.clear_form()
        self.refresh_table()

    def on_item_select(self, event):
        selected = self.tree.selection()
        if not selected: return
        item_values = self.tree.item(selected[0], "values")
        if not item_values: return
        target_name = item_values[0]
        
        target_item = None
        for item in self.menu_data:
            if item["name"] == target_name:
                target_item = item
                break
        
        if target_item:
            self.current_edit_id = target_item["id"]
            self.ent_name.delete(0, tk.END); self.ent_name.insert(0, target_item["name"])
            self.ent_price.delete(0, tk.END); self.ent_price.insert(0, target_item["price"])
            self.ent_desc.delete(0, tk.END); self.ent_desc.insert(0, target_item.get("description", ""))
            self.cmb_category.set(target_item.get("category", ""))
            v_code = target_item.get("venue", "res1")
            self.cmb_venue.set(VENUES_REVERSE.get(v_code, ""))
            self.var_ismenu.set(target_item.get("ismenu", False))
            self.btn_save.config(text="✏️ تعديل المادة", bg="#2980b9")

    def delete_item(self):
        selected = self.tree.selection()
        if not selected:
            messagebox.showwarning("تنبيه", "الرجاء تحديد مادة من الجدول لحذفها")
            return
        confirm = messagebox.askyesno("تأكيد الحذف", "هل أنت متأكد من حذف هذه المادة؟")
        if not confirm: return
        item_values = self.tree.item(selected[0], "values")
        target_name = item_values[0]
        self.menu_data = [i for i in self.menu_data if i["name"] != target_name]
        self.save_data()
        self.refresh_table()
        self.clear_form()

    def clear_form(self):
        self.current_edit_id = None
        self.ent_name.delete(0, tk.END)
        self.ent_price.delete(0, tk.END)
        self.ent_desc.delete(0, tk.END)
        self.cmb_category.set("")
        if self.user_venue == "all":
            self.cmb_venue.set("")
        self.var_ismenu.set(False)
        self.btn_save.config(text="✅ حفظ المادة", bg="#27ae60")

    def start_deploy(self):
        threading.Thread(target=self.run_deploy).start()

    def run_deploy(self):
        self.lbl_status.config(text="⏳ جاري الرفع إلى الموقع...", fg="yellow")
        try:
            result = subprocess.run(["firebase", "deploy", "--only", "hosting"], capture_output=True, text=True, shell=True)
            if result.returncode == 0:
                self.lbl_status.config(text="✅ تم التحديث بنجاح!", fg="#2ecc71")
                messagebox.showinfo("نجاح", "تم تحديث الموقع بنجاح!")
            else:
                self.lbl_status.config(text="❌ فشل التحديث", fg="#e74c3c")
                messagebox.showerror("خطأ", f"حدث خطأ:\n{result.stderr}")
        except Exception as e:
            self.lbl_status.config(text=f"Error: {str(e)}", fg="red")

if __name__ == "__main__":
    root = tk.Tk()
    login_screen = LoginWindow(root)
    root.mainloop()