import * as anchor from "@coral-xyz/anchor";
import { Program, BN } from "@coral-xyz/anchor";
import { TippingApp } from "../target/types/tipping_app";
import { PublicKey, Keypair, LAMPORTS_PER_SOL } from "@solana/web3.js";
import { assert, expect } from "chai";

describe("tipping_app", () => {
  // Configure the client to use the local cluster
  const provider = anchor.AnchorProvider.env();
  anchor.setProvider(provider);

  const program = anchor.workspace.TippingApp as Program<TippingApp>;
  
  // Test users
  let alice: Keypair;
  let bob: Keypair;
  let charlie: Keypair;
  
  // PDA accounts
  let aliceProfile: PublicKey;
  let aliceVault: PublicKey;
  let aliceHistory: PublicKey;
  let bobProfile: PublicKey;
  let bobVault: PublicKey;
  let bobHistory: PublicKey;
  let charlieProfile: PublicKey;
  let charlieVault: PublicKey;
  let charlieHistory: PublicKey;

  // Helper function to generate a valid tip seed (current timestamp in seconds)
  const generateTipSeed = (): BN => {
    return new BN(Math.floor(Date.now() / 1000));
  };

  // Helper function to derive tip transaction PDA with tip_seed
  const getTipTransactionPDA = (sender: PublicKey, tipSeed: BN): PublicKey => {
    const [pda] = PublicKey.findProgramAddressSync(
      [
        Buffer.from("tip"),
        sender.toBuffer(),
        tipSeed.toArrayLike(Buffer, "le", 8),
      ],
      program.programId
    );
    return pda;
  };

  before(async () => {
    // Create test users
    alice = Keypair.generate();
    bob = Keypair.generate();
    charlie = Keypair.generate();

    // Airdrop SOL to test users
    await provider.connection.requestAirdrop(alice.publicKey, 10 * LAMPORTS_PER_SOL);
    await provider.connection.requestAirdrop(bob.publicKey, 10 * LAMPORTS_PER_SOL);
    await provider.connection.requestAirdrop(charlie.publicKey, 10 * LAMPORTS_PER_SOL);

    // Wait for airdrops to complete
    await new Promise(resolve => setTimeout(resolve, 1000));

    // Derive PDAs for Alice
    [aliceProfile] = PublicKey.findProgramAddressSync(
      [Buffer.from("user_profile"), alice.publicKey.toBuffer()],
      program.programId
    );
    [aliceVault] = PublicKey.findProgramAddressSync(
      [Buffer.from("user_vault"), alice.publicKey.toBuffer()],
      program.programId
    );
    [aliceHistory] = PublicKey.findProgramAddressSync(
      [Buffer.from("tip_history"), alice.publicKey.toBuffer()],
      program.programId
    );

    // Derive PDAs for Bob
    [bobProfile] = PublicKey.findProgramAddressSync(
      [Buffer.from("user_profile"), bob.publicKey.toBuffer()],
      program.programId
    );
    [bobVault] = PublicKey.findProgramAddressSync(
      [Buffer.from("user_vault"), bob.publicKey.toBuffer()],
      program.programId
    );
    [bobHistory] = PublicKey.findProgramAddressSync(
      [Buffer.from("tip_history"), bob.publicKey.toBuffer()],
      program.programId
    );

    // Derive PDAs for Charlie
    [charlieProfile] = PublicKey.findProgramAddressSync(
      [Buffer.from("user_profile"), charlie.publicKey.toBuffer()],
      program.programId
    );
    [charlieVault] = PublicKey.findProgramAddressSync(
      [Buffer.from("user_vault"), charlie.publicKey.toBuffer()],
      program.programId
    );
    [charlieHistory] = PublicKey.findProgramAddressSync(
      [Buffer.from("tip_history"), charlie.publicKey.toBuffer()],
      program.programId
    );
  });

  describe("Happy Path Tests", () => {
    it("Initializes user profile, vault, and history for Alice", async () => {
      const tx = await program.methods
        .initializeUser()
        .accounts({
          userProfile: aliceProfile,
          userVault: aliceVault,
          tipHistory: aliceHistory,
          user: alice.publicKey,
          systemProgram: anchor.web3.SystemProgram.programId,
        })
        .signers([alice])
        .rpc();

      console.log("Alice initialized, tx:", tx);

      // Fetch and verify Alice's profile
      const profile = await program.account.userProfile.fetch(aliceProfile);
      assert.equal(profile.owner.toString(), alice.publicKey.toString());
      assert.equal(profile.totalSent.toNumber(), 0);
      assert.equal(profile.totalReceived.toNumber(), 0);
      assert.equal(profile.tipsSentCount.toNumber(), 0);
      assert.equal(profile.tipsReceivedCount.toNumber(), 0);

      // Fetch and verify Alice's vault
      const vault = await program.account.userVault.fetch(aliceVault);
      assert.equal(vault.owner.toString(), alice.publicKey.toString());
      assert.equal(vault.balance.toNumber(), 0);

      // Fetch and verify Alice's history
      const history = await program.account.tipHistory.fetch(aliceHistory);
      assert.equal(history.owner.toString(), alice.publicKey.toString());
      assert.equal(history.currentIndex, 0);
      assert.equal(history.tips.length, 0);
    });

    it("Initializes user profile, vault, and history for Bob", async () => {
      const tx = await program.methods
        .initializeUser()
        .accounts({
          userProfile: bobProfile,
          userVault: bobVault,
          tipHistory: bobHistory,
          user: bob.publicKey,
          systemProgram: anchor.web3.SystemProgram.programId,
        })
        .signers([bob])
        .rpc();

      console.log("Bob initialized, tx:", tx);

      // Fetch and verify Bob's profile
      const profile = await program.account.userProfile.fetch(bobProfile);
      assert.equal(profile.owner.toString(), bob.publicKey.toString());
      assert.equal(profile.totalSent.toNumber(), 0);
      assert.equal(profile.totalReceived.toNumber(), 0);
    });

    it("Alice sends a tip to Bob with a message", async () => {
      const tipAmount = new BN(0.1 * LAMPORTS_PER_SOL); // 0.1 SOL
      const message = "Great work!";
      const tipSeed = generateTipSeed();

      // Get Bob's vault balance before
      const vaultBefore = await program.account.userVault.fetch(bobVault);
      const bobVaultBalanceBefore = vaultBefore.balance.toNumber();

      // Derive tip transaction PDA with tip_seed
      const tipTransaction = getTipTransactionPDA(alice.publicKey, tipSeed);

      const tx = await program.methods
        .sendTip(tipAmount, message, tipSeed)
        .accounts({
          senderProfile: aliceProfile,
          senderHistory: aliceHistory,
          receiverProfile: bobProfile,
          receiverVault: bobVault,
          receiverHistory: bobHistory,
          tipTransaction: tipTransaction,
          sender: alice.publicKey,
          receiver: bob.publicKey,
          systemProgram: anchor.web3.SystemProgram.programId,
        })
        .signers([alice])
        .rpc();

      console.log("Tip sent, tx:", tx);

      // Verify Alice's profile updated
      const aliceProfileData = await program.account.userProfile.fetch(aliceProfile);
      assert.equal(aliceProfileData.totalSent.toNumber(), tipAmount.toNumber());
      assert.equal(aliceProfileData.tipsSentCount.toNumber(), 1);

      // Verify Bob's profile updated
      const bobProfileData = await program.account.userProfile.fetch(bobProfile);
      assert.equal(bobProfileData.totalReceived.toNumber(), tipAmount.toNumber());
      assert.equal(bobProfileData.tipsReceivedCount.toNumber(), 1);

      // Verify Bob's vault balance increased
      const vaultAfter = await program.account.userVault.fetch(bobVault);
      assert.equal(
        vaultAfter.balance.toNumber(),
        bobVaultBalanceBefore + tipAmount.toNumber()
      );

      // Verify tip transaction was created
      const tipTx = await program.account.tipTransaction.fetch(tipTransaction);
      assert.equal(tipTx.sender.toString(), alice.publicKey.toString());
      assert.equal(tipTx.receiver.toString(), bob.publicKey.toString());
      assert.equal(tipTx.amount.toNumber(), tipAmount.toNumber());
      assert.equal(tipTx.message, message);
      assert.equal(tipTx.tipSeed.toNumber(), tipSeed.toNumber());

      // Verify Alice's tip history
      const aliceHistoryData = await program.account.tipHistory.fetch(aliceHistory);
      assert.equal(aliceHistoryData.tips.length, 1);
      assert.equal(aliceHistoryData.tips[0].counterparty.toString(), bob.publicKey.toString());
      assert.equal(aliceHistoryData.tips[0].amount.toNumber(), tipAmount.toNumber());
      assert.equal(aliceHistoryData.tips[0].isSent, true);

      // Verify Bob's tip history
      const bobHistoryData = await program.account.tipHistory.fetch(bobHistory);
      assert.equal(bobHistoryData.tips.length, 1);
      assert.equal(bobHistoryData.tips[0].counterparty.toString(), alice.publicKey.toString());
      assert.equal(bobHistoryData.tips[0].amount.toNumber(), tipAmount.toNumber());
      assert.equal(bobHistoryData.tips[0].isSent, false);
    });

    it("Alice sends another tip to Bob without a message", async () => {
      const tipAmount = new BN(0.05 * LAMPORTS_PER_SOL); // 0.05 SOL
      const message = "";
      
      // Wait a bit to ensure unique tip_seed
      await new Promise(resolve => setTimeout(resolve, 1100));
      const tipSeed = generateTipSeed();

      // Derive tip transaction PDA with new tip_seed
      const tipTransaction = getTipTransactionPDA(alice.publicKey, tipSeed);

      const tx = await program.methods
        .sendTip(tipAmount, message, tipSeed)
        .accounts({
          senderProfile: aliceProfile,
          senderHistory: aliceHistory,
          receiverProfile: bobProfile,
          receiverVault: bobVault,
          receiverHistory: bobHistory,
          tipTransaction: tipTransaction,
          sender: alice.publicKey,
          receiver: bob.publicKey,
          systemProgram: anchor.web3.SystemProgram.programId,
        })
        .signers([alice])
        .rpc();

      console.log("Second tip sent, tx:", tx);

      // Verify Alice's stats updated
      const aliceProfileData = await program.account.userProfile.fetch(aliceProfile);
      assert.equal(aliceProfileData.tipsSentCount.toNumber(), 2);

      // Verify Bob's stats updated
      const bobProfileData = await program.account.userProfile.fetch(bobProfile);
      assert.equal(bobProfileData.tipsReceivedCount.toNumber(), 2);
    });

    it("Bob withdraws tips from his vault", async () => {
      // Get Bob's current balance
      const bobBalanceBefore = await provider.connection.getBalance(bob.publicKey);
      
      // Get vault balance
      const vaultBefore = await program.account.userVault.fetch(bobVault);
      const withdrawAmount = vaultBefore.balance;

      const tx = await program.methods
        .withdrawTips(withdrawAmount)
        .accounts({
          userVault: bobVault,
          user: bob.publicKey,
          systemProgram: anchor.web3.SystemProgram.programId,
        })
        .signers([bob])
        .rpc();

      console.log("Withdrawal successful, tx:", tx);

      // Verify vault balance is now 0
      const vaultAfter = await program.account.userVault.fetch(bobVault);
      assert.equal(vaultAfter.balance.toNumber(), 0);

      // Verify Bob's wallet balance increased (minus transaction fees)
      const bobBalanceAfter = await provider.connection.getBalance(bob.publicKey);
      assert.isTrue(bobBalanceAfter > bobBalanceBefore);
    });

    it("Tests quick-tip amounts (0.01, 0.05, 0.1, 0.5 SOL)", async () => {
      // Initialize Charlie
      await program.methods
        .initializeUser()
        .accounts({
          userProfile: charlieProfile,
          userVault: charlieVault,
          tipHistory: charlieHistory,
          user: charlie.publicKey,
          systemProgram: anchor.web3.SystemProgram.programId,
        })
        .signers([charlie])
        .rpc();

      const quickTipAmounts = [0.01, 0.05, 0.1, 0.5];
      
      for (let i = 0; i < quickTipAmounts.length; i++) {
        const tipAmount = new BN(quickTipAmounts[i] * LAMPORTS_PER_SOL);
        
        // Wait to ensure unique tip_seed
        await new Promise(resolve => setTimeout(resolve, 1100));
        const tipSeed = generateTipSeed();
        
        const tipTransaction = getTipTransactionPDA(bob.publicKey, tipSeed);

        await program.methods
          .sendTip(tipAmount, `Quick tip ${quickTipAmounts[i]} SOL`, tipSeed)
          .accounts({
            senderProfile: bobProfile,
            senderHistory: bobHistory,
            receiverProfile: charlieProfile,
            receiverVault: charlieVault,
            receiverHistory: charlieHistory,
            tipTransaction: tipTransaction,
            sender: bob.publicKey,
            receiver: charlie.publicKey,
            systemProgram: anchor.web3.SystemProgram.programId,
          })
          .signers([bob])
          .rpc();

        console.log(`Quick tip ${quickTipAmounts[i]} SOL sent`);
      }

      // Verify all tips were recorded
      const charlieProfileData = await program.account.userProfile.fetch(charlieProfile);
      assert.equal(charlieProfileData.tipsReceivedCount.toNumber(), 4);
    });

    it("Self-tipping updates both sent and received counts", async () => {
      // Wait to ensure unique tip_seed
      await new Promise(resolve => setTimeout(resolve, 1100));
      const tipSeed = generateTipSeed();
      
      const tipAmount = new BN(0.01 * LAMPORTS_PER_SOL);
      
      // Get Alice's profile before self-tip
      const profileBefore = await program.account.userProfile.fetch(aliceProfile);
      const sentBefore = profileBefore.tipsSentCount.toNumber();
      const receivedBefore = profileBefore.tipsReceivedCount.toNumber();
      
      const tipTransaction = getTipTransactionPDA(alice.publicKey, tipSeed);

      const tx = await program.methods
        .sendTip(tipAmount, "Self tip!", tipSeed)
        .accounts({
          senderProfile: aliceProfile,
          senderHistory: aliceHistory,
          receiverProfile: aliceProfile, // Same as sender
          receiverVault: aliceVault,     // Same as sender vault
          receiverHistory: aliceHistory, // Same as sender history
          tipTransaction: tipTransaction,
          sender: alice.publicKey,
          receiver: alice.publicKey,     // Self-tip
          systemProgram: anchor.web3.SystemProgram.programId,
        })
        .signers([alice])
        .rpc();

      console.log("Self-tip sent, tx:", tx);

      // Verify both sent and received counts increased
      const profileAfter = await program.account.userProfile.fetch(aliceProfile);
      assert.equal(profileAfter.tipsSentCount.toNumber(), sentBefore + 1, "tips_sent_count should increase");
      assert.equal(profileAfter.tipsReceivedCount.toNumber(), receivedBefore + 1, "tips_received_count should increase");
    });
  });

  describe("Unhappy Path Tests", () => {
    it("Fails to initialize user twice (duplicate)", async () => {
      try {
        await program.methods
          .initializeUser()
          .accounts({
            userProfile: aliceProfile,
            userVault: aliceVault,
            tipHistory: aliceHistory,
            user: alice.publicKey,
            systemProgram: anchor.web3.SystemProgram.programId,
          })
          .signers([alice])
          .rpc();
        
        assert.fail("Should have thrown an error");
      } catch (error) {
        // Expected to fail - account already exists
        assert.include(error.message.toLowerCase(), "already in use");
      }
    });

    it("Fails to send tip with zero amount", async () => {
      const tipAmount = new BN(0);
      const message = "This should fail";
      const tipSeed = generateTipSeed();

      const tipTransaction = getTipTransactionPDA(alice.publicKey, tipSeed);

      try {
        await program.methods
          .sendTip(tipAmount, message, tipSeed)
          .accounts({
            senderProfile: aliceProfile,
            senderHistory: aliceHistory,
            receiverProfile: bobProfile,
            receiverVault: bobVault,
            receiverHistory: bobHistory,
            tipTransaction: tipTransaction,
            sender: alice.publicKey,
            receiver: bob.publicKey,
            systemProgram: anchor.web3.SystemProgram.programId,
          })
          .signers([alice])
          .rpc();

        assert.fail("Should have thrown an error");
      } catch (error) {
        // Expected to fail - invalid amount
        console.log("Error (expected):", error.message);
        assert.isTrue(error.message.includes("InvalidAmount") || error.message.includes("invalid"));
      }
    });

    it("Fails to send tip with message too long", async () => {
      const tipAmount = new BN(0.01 * LAMPORTS_PER_SOL);
      const message = "This message is way too long and exceeds the thirty-two character limit!";
      
      // Wait to ensure unique tip_seed
      await new Promise(resolve => setTimeout(resolve, 1100));
      const tipSeed = generateTipSeed();

      const tipTransaction = getTipTransactionPDA(alice.publicKey, tipSeed);

      try {
        await program.methods
          .sendTip(tipAmount, message, tipSeed)
          .accounts({
            senderProfile: aliceProfile,
            senderHistory: aliceHistory,
            receiverProfile: bobProfile,
            receiverVault: bobVault,
            receiverHistory: bobHistory,
            tipTransaction: tipTransaction,
            sender: alice.publicKey,
            receiver: bob.publicKey,
            systemProgram: anchor.web3.SystemProgram.programId,
          })
          .signers([alice])
          .rpc();

        assert.fail("Should have thrown an error");
      } catch (error) {
        // Expected to fail - message too long
        console.log("Error (expected):", error.message);
        assert.isTrue(error.message.includes("MessageTooLong") || error.message.includes("message"));
      }
    });

    it("Fails to withdraw from empty vault", async () => {
      const withdrawAmount = new BN(1 * LAMPORTS_PER_SOL);

      try {
        await program.methods
          .withdrawTips(withdrawAmount)
          .accounts({
            userVault: bobVault,
            user: bob.publicKey,
            systemProgram: anchor.web3.SystemProgram.programId,
          })
          .signers([bob])
          .rpc();

        assert.fail("Should have thrown an error");
      } catch (error) {
        // Expected to fail - vault is empty or invalid amount
        console.log("Error (expected):", error.message);
        assert.isTrue(error.message.includes("VaultEmpty") || error.message.includes("InvalidAmount") || error.message.includes("insufficient"));
      }
    });

    it("Fails to withdraw from another user's vault (unauthorized)", async () => {
      const withdrawAmount = new BN(0.01 * LAMPORTS_PER_SOL);

      try {
        await program.methods
          .withdrawTips(withdrawAmount)
          .accounts({
            userVault: charlieVault,
            user: alice.publicKey,
            systemProgram: anchor.web3.SystemProgram.programId,
          })
          .signers([alice])
          .rpc();

        assert.fail("Should have thrown an error");
      } catch (error) {
        // Expected to fail - unauthorized
        console.log("Error (expected):", error.message);
        assert.isTrue(
          error.message.includes("Unauthorized") || 
          error.message.includes("constraint") ||
          error.message.includes("seeds")
        );
      }
    });

    it("Fails to send tip without sufficient funds", async () => {
      const tipAmount = new BN(100 * LAMPORTS_PER_SOL); // Way more than alice has
      
      // Wait to ensure unique tip_seed
      await new Promise(resolve => setTimeout(resolve, 1100));
      const tipSeed = generateTipSeed();

      const tipTransaction = getTipTransactionPDA(alice.publicKey, tipSeed);

      try {
        await program.methods
          .sendTip(tipAmount, "Too much!", tipSeed)
          .accounts({
            senderProfile: aliceProfile,
            senderHistory: aliceHistory,
            receiverProfile: bobProfile,
            receiverVault: bobVault,
            receiverHistory: bobHistory,
            tipTransaction: tipTransaction,
            sender: alice.publicKey,
            receiver: bob.publicKey,
            systemProgram: anchor.web3.SystemProgram.programId,
          })
          .signers([alice])
          .rpc();

        assert.fail("Should have thrown an error");
      } catch (error) {
        // Expected to fail - insufficient funds
        console.log("Error (expected):", error.message);
        assert.isTrue(
          error.message.includes("InsufficientFunds") ||
          error.message.includes("insufficient") ||
          error.message.includes("transfer")
        );
      }
    });

    it("Fails to send tip with invalid tip_seed (too old)", async () => {
      const tipAmount = new BN(0.01 * LAMPORTS_PER_SOL);
      const message = "Old seed";
      
      // Use a tip_seed from 10 minutes ago (should be rejected as >5 min old)
      const tipSeed = new BN(Math.floor(Date.now() / 1000) - 600);

      const tipTransaction = getTipTransactionPDA(alice.publicKey, tipSeed);

      try {
        await program.methods
          .sendTip(tipAmount, message, tipSeed)
          .accounts({
            senderProfile: aliceProfile,
            senderHistory: aliceHistory,
            receiverProfile: bobProfile,
            receiverVault: bobVault,
            receiverHistory: bobHistory,
            tipTransaction: tipTransaction,
            sender: alice.publicKey,
            receiver: bob.publicKey,
            systemProgram: anchor.web3.SystemProgram.programId,
          })
          .signers([alice])
          .rpc();

        assert.fail("Should have thrown an error");
      } catch (error) {
        // Expected to fail - invalid tip seed
        console.log("Error (expected):", error.message);
        assert.isTrue(
          error.message.includes("InvalidTipSeed") ||
          error.message.includes("tip seed") ||
          error.message.includes("invalid")
        );
      }
    });
  });
});
