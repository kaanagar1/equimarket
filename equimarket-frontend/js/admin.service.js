/**
 * EquiMarket Admin Service
 * Admin panel işlemleri - dashboard, kullanıcılar, ilanlar, bloglar
 */

const AdminService = {
    // ==================== DASHBOARD ====================

    async getStats() {
        try {
            return await api.get('/admin/stats');
        } catch (error) {
            console.error('AdminService.getStats Error:', error);
            return { success: false, message: error.message };
        }
    },

    async getChartData() {
        try {
            return await api.get('/admin/charts');
        } catch (error) {
            console.error('AdminService.getChartData Error:', error);
            return { success: false, message: error.message };
        }
    },

    // ==================== USERS ====================

    async getUsers(filters = {}) {
        try {
            const params = new URLSearchParams();
            Object.entries(filters).forEach(([key, value]) => {
                if (value !== undefined && value !== '' && value !== null) {
                    params.append(key, value);
                }
            });
            const query = params.toString();
            return await api.get('/admin/users' + (query ? '?' + query : ''));
        } catch (error) {
            console.error('AdminService.getUsers Error:', error);
            return { success: false, message: error.message };
        }
    },

    async getUser(id) {
        try {
            return await api.get('/admin/users/' + id);
        } catch (error) {
            console.error('AdminService.getUser Error:', error);
            return { success: false, message: error.message };
        }
    },

    async updateUser(id, data) {
        try {
            return await api.put('/admin/users/' + id, data);
        } catch (error) {
            console.error('AdminService.updateUser Error:', error);
            return { success: false, message: error.message };
        }
    },

    async deleteUser(id) {
        try {
            return await api.delete('/admin/users/' + id);
        } catch (error) {
            console.error('AdminService.deleteUser Error:', error);
            return { success: false, message: error.message };
        }
    },

    // ==================== LISTINGS ====================

    async getListings(filters = {}) {
        try {
            const params = new URLSearchParams();
            Object.entries(filters).forEach(([key, value]) => {
                if (value !== undefined && value !== '' && value !== null) {
                    params.append(key, value);
                }
            });
            const query = params.toString();
            return await api.get('/admin/listings' + (query ? '?' + query : ''));
        } catch (error) {
            console.error('AdminService.getListings Error:', error);
            return { success: false, message: error.message };
        }
    },

    async updateListing(id, data) {
        try {
            return await api.put('/admin/listings/' + id, data);
        } catch (error) {
            console.error('AdminService.updateListing Error:', error);
            return { success: false, message: error.message };
        }
    },

    async deleteListing(id) {
        try {
            return await api.delete('/admin/listings/' + id);
        } catch (error) {
            console.error('AdminService.deleteListing Error:', error);
            return { success: false, message: error.message };
        }
    },

    async approveListing(id) {
        try {
            return await api.put('/admin/listings/' + id, { status: 'active' });
        } catch (error) {
            console.error('AdminService.approveListing Error:', error);
            return { success: false, message: error.message };
        }
    },

    async rejectListing(id, reason) {
        try {
            return await api.put('/admin/listings/' + id, { status: 'rejected', rejectionReason: reason });
        } catch (error) {
            console.error('AdminService.rejectListing Error:', error);
            return { success: false, message: error.message };
        }
    },

    async bulkApproveListings(ids) {
        try {
            return await api.post('/admin/listings/bulk-approve', { ids });
        } catch (error) {
            console.error('AdminService.bulkApproveListings Error:', error);
            return { success: false, message: error.message };
        }
    },

    // ==================== BLOGS ====================

    async getBlogs(filters = {}) {
        try {
            const params = new URLSearchParams();
            Object.entries(filters).forEach(([key, value]) => {
                if (value !== undefined && value !== '' && value !== null) {
                    params.append(key, value);
                }
            });
            const query = params.toString();
            return await api.get('/admin/blogs' + (query ? '?' + query : ''));
        } catch (error) {
            console.error('AdminService.getBlogs Error:', error);
            return { success: false, message: error.message };
        }
    },

    async getBlog(id) {
        try {
            return await api.get('/admin/blogs/' + id);
        } catch (error) {
            console.error('AdminService.getBlog Error:', error);
            return { success: false, message: error.message };
        }
    },

    async createBlog(data) {
        try {
            return await api.post('/admin/blogs', data);
        } catch (error) {
            console.error('AdminService.createBlog Error:', error);
            return { success: false, message: error.message };
        }
    },

    async updateBlog(id, data) {
        try {
            return await api.put('/admin/blogs/' + id, data);
        } catch (error) {
            console.error('AdminService.updateBlog Error:', error);
            return { success: false, message: error.message };
        }
    },

    async deleteBlog(id) {
        try {
            return await api.delete('/admin/blogs/' + id);
        } catch (error) {
            console.error('AdminService.deleteBlog Error:', error);
            return { success: false, message: error.message };
        }
    },

    // ==================== SUPPORT ====================

    async getContactMessages(filters = {}) {
        try {
            const params = new URLSearchParams();
            Object.entries(filters).forEach(([key, value]) => {
                if (value !== undefined && value !== '' && value !== null) {
                    params.append(key, value);
                }
            });
            const query = params.toString();
            return await api.get('/admin/support/contacts' + (query ? '?' + query : ''));
        } catch (error) {
            console.error('AdminService.getContactMessages Error:', error);
            return { success: false, message: error.message };
        }
    },

    async updateContactMessage(id, data) {
        try {
            return await api.put('/admin/support/contacts/' + id, data);
        } catch (error) {
            console.error('AdminService.updateContactMessage Error:', error);
            return { success: false, message: error.message };
        }
    },

    async getReports(filters = {}) {
        try {
            const params = new URLSearchParams();
            Object.entries(filters).forEach(([key, value]) => {
                if (value !== undefined && value !== '' && value !== null) {
                    params.append(key, value);
                }
            });
            const query = params.toString();
            return await api.get('/admin/support/reports' + (query ? '?' + query : ''));
        } catch (error) {
            console.error('AdminService.getReports Error:', error);
            return { success: false, message: error.message };
        }
    },

    async updateReport(id, data) {
        try {
            return await api.put('/admin/support/reports/' + id, data);
        } catch (error) {
            console.error('AdminService.updateReport Error:', error);
            return { success: false, message: error.message };
        }
    }
};
