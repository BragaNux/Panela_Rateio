using Microsoft.EntityFrameworkCore;
using Panela.Api.Models;

namespace Panela.Api.Data;
public class AppDbContext : DbContext
{
    public AppDbContext(DbContextOptions<AppDbContext> options) : base(options) {}
    
    public DbSet<User> Users => Set<User>();
    public DbSet<Group> Groups => Set<Group>();
    public DbSet<Member> Members => Set<Member>();
    public DbSet<Expense> Expenses => Set<Expense>();
    public DbSet<Split> Splits => Set<Split>();
    public DbSet<FriendRequest> FriendRequests => Set<FriendRequest>();
    public DbSet<Friendship> Friendships => Set<Friendship>();
    public DbSet<PasswordReset> PasswordResets => Set<PasswordReset>();
    public DbSet<Notification> Notifications => Set<Notification>();
    
    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        base.OnModelCreating(modelBuilder);
        
        // Configurar mapeamento de nomes para User
        modelBuilder.Entity<User>(entity =>
        {
            entity.ToTable("Users");
            entity.Property(e => e.Id).HasColumnName("Id");
            entity.Property(e => e.Nome).HasColumnName("Nome");
            entity.Property(e => e.Email).HasColumnName("Email");
            entity.Property(e => e.PasswordHash).HasColumnName("PasswordHash");
            entity.Property(e => e.ChavePix).HasColumnName("ChavePix");
            entity.Property(e => e.CreatedAt).HasColumnName("CreatedAt");
            
            entity.HasIndex(e => e.Email).IsUnique();
        });
        
        // Configurar mapeamento para Group
        modelBuilder.Entity<Group>(entity =>
        {
            entity.ToTable("Groups");
            entity.Property(e => e.Id).HasColumnName("Id");
            entity.Property(e => e.Nome).HasColumnName("Nome");
            entity.Property(e => e.Descricao).HasColumnName("Descricao");
            entity.Property(e => e.CreatorId).HasColumnName("CreatorId");
            entity.Property(e => e.CreatedAt).HasColumnName("CreatedAt");
            entity.Property(e => e.Finalizado).HasColumnName("Finalizado");
            entity.Property(e => e.FinalizadoEm).HasColumnName("FinalizadoEm");
            
            entity.HasOne(g => g.Creator)
                .WithMany(u => u.GroupsCreated)
                .HasForeignKey(g => g.CreatorId)
                .OnDelete(DeleteBehavior.Restrict);
        });
        
        // Configurar mapeamento para Member
        modelBuilder.Entity<Member>(entity =>
        {
            entity.ToTable("Members");
            entity.Property(e => e.Id).HasColumnName("Id");
            entity.Property(e => e.GroupId).HasColumnName("GroupId");
            entity.Property(e => e.UserId).HasColumnName("UserId");
            entity.Property(e => e.JoinedAt).HasColumnName("JoinedAt");
            
            entity.HasOne(m => m.Group)
                .WithMany(g => g.Members)
                .HasForeignKey(m => m.GroupId)
                .OnDelete(DeleteBehavior.Cascade);
            
            entity.HasOne(m => m.User)
                .WithMany(u => u.Memberships)
                .HasForeignKey(m => m.UserId)
                .OnDelete(DeleteBehavior.Cascade);
            
            entity.HasIndex(m => new { m.GroupId, m.UserId }).IsUnique();
        });
        
        // Configurar mapeamento para Expense
        modelBuilder.Entity<Expense>(entity =>
        {
            entity.ToTable("Expenses");
            entity.Property(e => e.Id).HasColumnName("Id");
            entity.Property(e => e.GroupId).HasColumnName("GroupId");
            entity.Property(e => e.Descricao).HasColumnName("Descricao");
            entity.Property(e => e.Amount).HasColumnName("Amount");
            entity.Property(e => e.PayerId).HasColumnName("PayerId");
            entity.Property(e => e.PagadorNome).HasColumnName("PagadorNome");
            entity.Property(e => e.Date).HasColumnName("Date");
            entity.Property(e => e.CreatedAt).HasColumnName("CreatedAt");
            
            entity.HasOne(e => e.Group)
                .WithMany(g => g.Expenses)
                .HasForeignKey(e => e.GroupId)
                .OnDelete(DeleteBehavior.Cascade);
            
            entity.HasOne(e => e.Payer)
                .WithMany(u => u.ExpensesPaid)
                .HasForeignKey(e => e.PayerId)
                .OnDelete(DeleteBehavior.Restrict);
        });
        
        // Configurar mapeamento para Split
        modelBuilder.Entity<Split>(entity =>
        {
            entity.ToTable("Splits");
            entity.Property(e => e.Id).HasColumnName("Id");
            entity.Property(e => e.ExpenseId).HasColumnName("ExpenseId");
            entity.Property(e => e.MemberId).HasColumnName("MemberId");
            entity.Property(e => e.Mode).HasColumnName("Mode");
            entity.Property(e => e.ShareValue).HasColumnName("ShareValue");
            entity.Property(e => e.CreatedAt).HasColumnName("CreatedAt");
            
            entity.HasOne(s => s.Expense)
                .WithMany(e => e.Splits)
                .HasForeignKey(s => s.ExpenseId)
                .OnDelete(DeleteBehavior.Cascade);
        });
        
        // Configurar mapeamento para FriendRequest
        modelBuilder.Entity<FriendRequest>(entity =>
        {
            entity.ToTable("FriendRequests");
            entity.Property(e => e.Id).HasColumnName("Id");
            entity.Property(e => e.RemetenteId).HasColumnName("RemetenteId");
            entity.Property(e => e.DestinatarioId).HasColumnName("DestinatarioId");
            entity.Property(e => e.Status).HasColumnName("Status");
            entity.Property(e => e.CreatedAt).HasColumnName("CreatedAt");
            entity.Property(e => e.UpdatedAt).HasColumnName("UpdatedAt");
        });
        
        // Configurar mapeamento para Friendship
        modelBuilder.Entity<Friendship>(entity =>
        {
            entity.ToTable("Friendships");
            entity.HasKey(f => new { f.UserId1, f.UserId2 });
            entity.Property(e => e.UserId1).HasColumnName("UserId1");
            entity.Property(e => e.UserId2).HasColumnName("UserId2");
            entity.Property(e => e.CreatedAt).HasColumnName("CreatedAt");
        });

        // Configurar mapeamento para Notification
        modelBuilder.Entity<Notification>(entity =>
        {
            entity.ToTable("Notifications");
            entity.Property(e => e.Id).HasColumnName("Id");
            entity.Property(e => e.UserId).HasColumnName("UserId");
            entity.Property(e => e.Type).HasColumnName("Type");
            entity.Property(e => e.Message).HasColumnName("Message");
            entity.Property(e => e.IsRead).HasColumnName("IsRead");
            entity.Property(e => e.CreatedAt).HasColumnName("CreatedAt");
            entity.HasIndex(e => new { e.UserId, e.IsRead });
            entity.HasOne(n => n.User)
                .WithMany()
                .HasForeignKey(n => n.UserId)
                .OnDelete(DeleteBehavior.Cascade);
        });

        // PasswordReset
        modelBuilder.Entity<PasswordReset>(entity =>
        {
            entity.ToTable("PasswordResets");
            entity.Property(e => e.Id).HasColumnName("Id");
            entity.Property(e => e.UserId).HasColumnName("UserId");
            entity.Property(e => e.CodeHash).HasColumnName("CodeHash");
            entity.Property(e => e.ExpiresAt).HasColumnName("ExpiresAt");
            entity.Property(e => e.Used).HasColumnName("Used");
            entity.Property(e => e.CreatedAt).HasColumnName("CreatedAt");
            entity.HasOne(e => e.User)
                .WithMany()
                .HasForeignKey(e => e.UserId)
                .OnDelete(DeleteBehavior.Cascade);
            entity.HasIndex(e => new { e.UserId, e.Used });
        });
    }
}
